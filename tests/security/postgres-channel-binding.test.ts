import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type TLSSocket } from 'node:tls';
import {
  createHash,
  createHmac,
  pbkdf2Sync,
  X509Certificate,
} from 'node:crypto';
import { ChannelBoundClient } from '../../packages/database/src/channel-bound-client.ts';
import { neonConnectionConfig } from '../../packages/database/src/postgres.ts';

const url =
  'postgresql://owner:fictional-password@ep-demo.us-east-2.aws.neon.tech/neondb';
describe('strict Neon connection configuration', () => {
  it('enforces certificate verification and PLUS independently of URL flags', () => {
    const config = neonConnectionConfig(
      url + '?sslmode=require&channel_binding=require',
    );
    expect(config.ssl).toMatchObject({
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    });
    expect(config.enableChannelBinding).toBe(true);
    expect(config.Client).toBe(ChannelBoundClient);
    expect(config.connectionString).toBeUndefined();
    expect(neonConnectionConfig(url).ssl).toEqual(config.ssl);
  });
  it.each([
    '?sslmode=disable',
    '?sslmode=prefer',
    '?sslmode=no-verify',
    '?channel_binding=prefer',
    '?channel_binding=disable',
    '?sslmode=require&sslmode=disable',
    '?sslrootcert=/tmp/hostile',
    '?host=evil.example',
    '?options=-c%20search_path%3Devil',
    '?uselibpqcompat=true',
  ])('rejects unsafe/unsupported query options %s', (suffix) => {
    expect(() => neonConnectionConfig(url + suffix)).toThrow(
      'connection option',
    );
  });
  it.each([
    'not-a-url',
    url.replace('postgresql:', 'https:'),
    url.replace('.neon.tech', '.neon.tech.evil.example'),
    url.replace('/neondb', ':9999/neondb'),
    url.replace('/neondb', '/db/extra'),
    url + '#fragment',
    url.replace('fictional-password', '%ZZ'),
    url.replace('owner:fictional-password@', ''),
  ])(
    'rejects invalid connection input without echoing credentials %#',
    (value) => {
      let message = '';
      try {
        neonConnectionConfig(value);
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toMatch(/Invalid|must be/);
      expect(message).not.toContain('fictional-password');
    },
  );
});

// An independent TLS PostgreSQL protocol peer exercises pg's actual wire handlers.
// Certificates/keys are ephemeral test data, never deployed or committed.
let directory: string, key: Buffer, cert: Buffer;
beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'tracelab-tls-'));
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
      '-keyout',
      join(directory, 'key.pem'),
      '-out',
      join(directory, 'cert.pem'),
    ],
    { stdio: 'ignore' },
  );
  key = readFileSync(join(directory, 'key.pem'));
  cert = readFileSync(join(directory, 'cert.pem'));
});
afterAll(() => rmSync(directory, { recursive: true, force: true }));
function packet(type: string, payload: Buffer) {
  const length = Buffer.alloc(4);
  length.writeInt32BE(payload.length + 4);
  return Buffer.concat([Buffer.from(type), length, payload]);
}
function authentication(code: number, text = '') {
  const n = Buffer.alloc(4);
  n.writeInt32BE(code);
  return packet('R', Buffer.concat([n, Buffer.from(text)]));
}
const ready = () =>
  Buffer.concat([authentication(0), packet('Z', Buffer.from('I'))]);
const hmac = (key: Buffer, text: string) =>
  createHmac('sha256', key).update(text).digest();
type Scenario =
  | 'cleartext'
  | 'md5'
  | 'unbound'
  | 'trust'
  | 'early-ready'
  | 'bad-proof'
  | 'valid'
  | 'repeat-auth'
  | 'repeat-continue'
  | 'early-final';
async function peer(scenario: Scenario, verifyCertificate = true) {
  const sockets = new Set<TLSSocket>();
  let bindingCorrect = false,
    receivedPassword = false;
  const server = createServer(
    { key, cert, ALPNProtocols: ['postgresql'] },
    (socket) => {
      sockets.add(socket);
      socket.on('error', () => undefined);
      let buffer = Buffer.alloc(0),
        stage = 0,
        clientFirst = '',
        serverFirst = '';
      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= (stage === 0 ? 4 : 5)) {
          const offset = stage === 0 ? 0 : 1;
          const length = buffer.readInt32BE(offset) + offset;
          if (buffer.length < length) return;
          const body = buffer.subarray(offset + 4, length);
          buffer = buffer.subarray(length);
          if (stage++ === 0) {
            if (scenario === 'cleartext') socket.write(authentication(3));
            else if (scenario === 'md5')
              socket.write(authentication(5, 'salt'));
            else if (scenario === 'trust') socket.write(ready());
            else
              socket.write(
                authentication(
                  10,
                  scenario === 'unbound'
                    ? 'SCRAM-SHA-256\0\0'
                    : 'SCRAM-SHA-256\0SCRAM-SHA-256-PLUS\0\0',
                ),
              );
          } else if (stage === 2) {
            receivedPassword = true;
            const mechanismEnd = body.indexOf(0);
            const mechanism = body.subarray(0, mechanismEnd).toString();
            if (mechanism !== 'SCRAM-SHA-256-PLUS') {
              socket.destroy();
              return;
            }
            clientFirst = body
              .subarray(mechanismEnd + 5)
              .toString()
              .slice('p=tls-server-end-point,,'.length);
            if (scenario === 'early-ready') {
              socket.write(ready());
              return;
            }
            if (scenario === 'repeat-auth') {
              socket.write(authentication(3));
              return;
            }
            const nonce = clientFirst.split(',r=')[1];
            serverFirst = `r=${nonce}serverNonce,s=${Buffer.from('controlled-salt').toString('base64')},i=4096`;
            if (scenario === 'early-final') {
              socket.write(authentication(12, 'v=invalid'));
              return;
            }
            socket.write(authentication(11, serverFirst));
            if (scenario === 'repeat-continue')
              socket.write(authentication(11, serverFirst));
          } else if (stage === 3) {
            const final = body.toString();
            const withoutProof = final.slice(0, final.lastIndexOf(',p='));
            const expectedBinding = Buffer.concat([
              Buffer.from('p=tls-server-end-point,,'),
              createHash('sha256')
                .update(new X509Certificate(cert).raw)
                .digest(),
            ]).toString('base64');
            bindingCorrect = final.startsWith(`c=${expectedBinding},`);
            const salted = pbkdf2Sync(
              'fixture-password',
              'controlled-salt',
              4096,
              32,
              'sha256',
            );
            const signature = hmac(
              hmac(salted, 'Server Key'),
              `${clientFirst},${serverFirst},${withoutProof}`,
            ).toString('base64');
            socket.write(
              authentication(
                12,
                `v=${scenario === 'bad-proof' ? Buffer.alloc(32).toString('base64') : signature}`,
              ),
            );
            socket.write(ready());
          }
        }
      });
    },
  );
  server.on('tlsClientError', () => undefined);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('Missing test port');
  const client = new ChannelBoundClient({
    host: '127.0.0.1',
    port: address.port,
    user: 'fixture',
    database: 'fixture',
    password: 'fixture-password',
    ssl: {
      ca: verifyCertificate ? cert : undefined,
      servername: 'localhost',
      rejectUnauthorized: true,
    },
    sslnegotiation: 'direct',
    enableChannelBinding: true,
    connectionTimeoutMillis: 2000,
  });
  let error: Error | undefined;
  client.on('error', () => undefined);
  try {
    await client.connect();
  } catch (e) {
    error = e as Error;
  }
  const verified = client.channelBindingVerified;
  await client.end().catch(() => undefined);
  for (const socket of sockets) socket.destroy();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return { error, verified, bindingCorrect, receivedPassword };
}
it('authenticates with independently verified TLS certificate binding and server signature', async () => {
  const result = await peer('valid');
  expect(result.error).toBeUndefined();
  expect(result.verified).toBe(true);
  expect(result.bindingCorrect).toBe(true);
});
it.each([
  'cleartext',
  'md5',
  'unbound',
  'trust',
  'early-ready',
  'bad-proof',
  'repeat-auth',
  'repeat-continue',
  'early-final',
] as const)(
  'rejects %s authentication over a real TLS socket',
  async (scenario) => {
    const result = await peer(scenario);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.verified).toBe(false);
    if (['cleartext', 'md5', 'unbound', 'trust'].includes(scenario))
      expect(result.receivedPassword).toBe(false);
  },
);
it('rejects an untrusted certificate before sending authentication data', async () => {
  const result = await peer('valid', false);
  expect(result.error).toBeInstanceOf(Error);
  expect(result.verified).toBe(false);
  expect(result.receivedPassword).toBe(false);
});
