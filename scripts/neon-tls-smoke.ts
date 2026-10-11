/** Read-only proof of the actual Node/PostgreSQL transport and authentication. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { TLSSocket } from 'node:tls';
import { ChannelBoundClient } from '../packages/database/src/channel-bound-client.ts';
import { neonConnectionConfig } from '../packages/database/src/postgres.ts';

if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required');
const client = new ChannelBoundClient(
  neonConnectionConfig(process.env.DATABASE_URL),
);
try {
  await client.connect();
  const stream = client.connection.stream;
  assert.ok(stream instanceof TLSSocket && stream.authorized);
  assert.equal(client.channelBindingVerified, true);
  const result = await client.query('SELECT 1 AS connected');
  assert.equal(result.rows[0].connected, 1);
  const evidence = {
    measuredAt: new Date().toISOString(),
    transport: 'PostgreSQL TCP with certificate-verified TLS',
    tlsProtocol: stream.getProtocol(),
    channelBinding: 'SCRAM-SHA-256-PLUS; server proof verified',
    readOnlyProbe: 'passed',
  };
  await writeFile(
    'artifacts/neon-tls-smoke.json',
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(JSON.stringify(evidence));
} catch {
  console.error(
    'Neon TLS/channel-binding verification failed; no credentials logged',
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
