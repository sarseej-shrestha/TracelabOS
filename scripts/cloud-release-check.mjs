const endpoint = 'https://tracelabos.sarseej-shrestha.workers.dev/api/health';
const validSha = (value) =>
  typeof value === 'string' &&
  value.length === 40 &&
  /^[a-f0-9]{40}$/.test(value)
    ? value
    : null;
export class ReleaseVerificationError extends Error {
  constructor(report) {
    super(
      'Both exact release identities and private persistence were not verified within the bounded deadline',
    );
    this.report = report;
  }
}
async function readHealth(response) {
  if (!response.body) throw new Error('Missing body');
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16384) throw new Error('Health body exceeds limit');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    await reader.cancel().catch(() => {});
  }
}
export async function verifyCloudRelease(expected, dependencies = {}) {
  if (!validSha(expected))
    throw new Error('A full lowercase release SHA is required');
  const request = dependencies.fetch ?? globalThis.fetch;
  const now = dependencies.now ?? (() => performance.now());
  const sleep =
    dependencies.sleep ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const started = now();
  const deadline = started + 90000;
  const attempts = [];
  for (let count = 0; count < 18 && now() < deadline; count++) {
    const attempt = {
      elapsedMs: Math.round(now() - started),
      status: null,
      apiRelease: null,
      workerRelease: null,
      outcome: 'NETWORK_ERROR',
    };
    let health;
    try {
      const response = await request(endpoint, {
        signal: AbortSignal.timeout(
          Math.max(1, Math.ceil(Math.min(10000, deadline - now()))),
        ),
        redirect: 'error',
        cache: 'no-store',
      });
      attempt.status = response.status;
      attempt.workerRelease = validSha(
        response.headers.get('x-tracelab-worker-release'),
      );
      if (response.status !== 200) {
        attempt.outcome = 'HTTP_ERROR';
        await response.body?.cancel();
      } else {
        attempt.outcome = 'INVALID_RESPONSE';
        const value = await readHealth(response);
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          attempt.apiRelease = validSha(value.release);
          if (
            value.status !== 'ok' ||
            value.persistence !== 'neon-postgresql' ||
            value.imageStorage !== 'private-neon'
          ) {
            attempt.outcome = 'HEALTH_MISMATCH';
          } else if (
            attempt.apiRelease !== expected ||
            attempt.workerRelease !== expected
          ) {
            attempt.outcome = 'VERSION_MISMATCH';
          } else {
            attempt.outcome = 'READY';
            // Preserve only validated operational fields, never arbitrary response properties.
            health = {
              status: 'ok',
              persistence: 'neon-postgresql',
              imageStorage: 'private-neon',
              release: expected,
            };
          }
        }
      }
    } catch {
      /* Keep the safe category; never include arbitrary provider error text or body. */
    }
    attempts.push(attempt);
    if (health && now() < deadline)
      return {
        release: expected,
        worker: 'tracelabos',
        health,
        bothCommitsVerified: true,
        durationMs: Math.round(now() - started),
        attempts,
      };
    const remaining = deadline - now();
    if (count < 17 && remaining > 0) await sleep(Math.min(5000, remaining));
  }
  throw new ReleaseVerificationError({
    release: expected,
    worker: 'tracelabos',
    bothCommitsVerified: false,
    durationMs: Math.round(now() - started),
    attempts,
  });
}
