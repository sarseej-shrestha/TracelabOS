import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  configuredImageStore,
  imagePrefix,
} from '../packages/vision-adapter/src/storage.ts';

const store = configuredImageStore();
if (store?.kind !== 'private-neon' || !process.argv.includes('--write-fixture'))
  throw Error(
    'Configure Neon storage and pass --write-fixture; creates then deletes one controlled object',
  );
const key = `${imagePrefix}${randomUUID()}/${randomUUID()}.jpg`;
let created = false;
try {
  const bytes = await sharp({
    create: { width: 24, height: 24, channels: 3, background: '#fff' },
  })
    .jpeg()
    .toBuffer();
  await store.put(key, bytes);
  created = true;
  assert.deepEqual(Buffer.from(await store.get(key)), bytes);
  let cursor: string | undefined;
  let found = false;
  for (let page = 0; page < 10; page++) {
    const listing = await store.list(cursor);
    found ||= listing.objects.some((object) => object.key === key);
    cursor = listing.cursor;
    if (found || !cursor) break;
  }
  assert.equal(found, true);
  const anonymous = await fetch(
    `${process.env.NEON_STORAGE_ENDPOINT}/${process.env.NEON_STORAGE_BUCKET}/${key}`,
    { signal: AbortSignal.timeout(10000), redirect: 'error' },
  );
  assert.ok([401, 403].includes(anonymous.status));
  await anonymous.body?.cancel();
  await store.delete(key);
  created = false;
  await assert.rejects(() => store.get(key));
  const report = {
    executedAt: new Date().toISOString(),
    provider: store.kind,
    bucket: process.env.NEON_STORAGE_BUCKET,
    anonymousStatus: anonymous.status,
    checks: [
      'signed upload',
      'byte-identical retrieval',
      'prefix listing',
      'anonymous read denied',
      'controlled object deleted',
      'deleted object unavailable',
    ],
    fixture:
      'Generated blank JPEG; only this randomly named smoke object was deleted.',
    limitations:
      'Storage transport verification; browser deployment and retention scheduling remain separate.',
  };
  await writeFile(
    'artifacts/neon-object-storage-smoke.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    JSON.stringify({
      status: 'failed',
      errorType: error instanceof Error ? error.name : 'unknown',
    }),
  );
  process.exitCode = 1;
} finally {
  if (created)
    await store.delete(key).catch(() => {
      console.error(
        'Controlled smoke object cleanup failed; reconcile before retrying',
      );
      process.exitCode = 1;
    });
}
