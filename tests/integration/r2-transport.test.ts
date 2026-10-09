import { afterAll, beforeAll, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { S3Client } from '@aws-sdk/client-s3';
import {
  configuredImageStore,
  R2ImageStore,
  StorageUnavailable,
} from '../../packages/vision-adapter/src/storage.ts';
let server: Server, client: S3Client, store: R2ImageStore;
const key =
  'tracelab-images/v1/00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002.jpg';
const requests: {
  method: string;
  signed: boolean;
  path: string;
  body: Buffer;
}[] = [];
let unavailable = false;
beforeAll(async () => {
  server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({
      method: req.method!,
      signed: (req.headers.authorization ?? '').startsWith('AWS4-HMAC-SHA256 '),
      path: req.url!,
      body: Buffer.concat(chunks),
    });
    if (unavailable) {
      res.writeHead(503);
      res.end();
      return;
    }
    if (req.url?.includes('list-type=2')) {
      res.setHeader('Content-Type', 'application/xml');
      res.end(
        `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>${key}</Key><LastModified>2026-01-01T00:00:00.000Z</LastModified><Size>3</Size></Contents></ListBucketResult>`,
      );
    } else if (req.method === 'GET') {
      res.setHeader('Content-Length', '3');
      res.end(Buffer.from([1, 2, 3]));
    } else {
      res.writeHead(req.method === 'DELETE' ? 204 : 200);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server');
  client = new S3Client({
    endpoint: `http://127.0.0.1:${address.port}`,
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'test-only-access',
      secretAccessKey: 'test-only-secret',
    },
    maxAttempts: 1,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  store = new R2ImageStore(client, 'test-private-bucket');
});
afterAll(async () => {
  client.destroy();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
it('sends signed S3 put/get/list/delete HTTP requests without public image URLs', async () => {
  await store.put(key, new Uint8Array([1, 2, 3]));
  expect(Array.from(await store.get(key))).toEqual([1, 2, 3]);
  expect((await store.list()).objects).toEqual([
    { key, modified: new Date('2026-01-01') },
  ]);
  await store.delete(key);
  expect(requests.map((r) => r.method)).toEqual([
    'PUT',
    'GET',
    'GET',
    'DELETE',
  ]);
  expect(requests.every((r) => r.signed)).toBe(true);
  expect(requests[0]!.body).toEqual(Buffer.from([1, 2, 3]));
});
it('sanitizes provider outages into a stable error', async () => {
  unavailable = true;
  try {
    await expect(store.get(key)).rejects.toBeInstanceOf(StorageUnavailable);
  } finally {
    unavailable = false;
  }
});
it('rejects object keys outside the application namespace before network access', async () => {
  const count = requests.length;
  await expect(store.delete('another-project/photo.jpg')).rejects.toThrow(
    'Invalid image',
  );
  expect(requests).toHaveLength(count);
});
it('requires complete cloud configuration and otherwise leaves local mode available', () => {
  expect(configuredImageStore({})).toBeUndefined();
  expect(() => configuredImageStore({ R2_BUCKET: 'incomplete' })).toThrow(
    'Incomplete R2',
  );
});
