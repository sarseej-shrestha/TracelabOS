import { rm, writeFile } from 'node:fs/promises';
import {
  ReleaseVerificationError,
  verifyCloudRelease,
} from './cloud-release-check.mjs';
let report;
await rm('artifacts/cloud-release-smoke.json', { force: true });
try {
  report = await verifyCloudRelease(process.env.TRACELAB_RELEASE_SHA);
} catch (error) {
  if (!(error instanceof ReleaseVerificationError)) throw error;
  report = error.report;
  process.exitCode = 1;
}
const evidence = { measuredAt: new Date().toISOString(), ...report };
await writeFile(
  'artifacts/cloud-release-smoke.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
