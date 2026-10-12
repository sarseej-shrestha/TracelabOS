import { expect, it, vi } from 'vitest';
import {
  verifyCloudRelease,
  ReleaseVerificationError,
} from '../../scripts/cloud-release-check.mjs';
const sha = 'a'.repeat(40),
  old = 'b'.repeat(40);
function health(api = sha, worker = sha, extra: Record<string, unknown> = {}) {
  return Response.json(
    {
      status: 'ok',
      persistence: 'neon-postgresql',
      imageStorage: 'private-neon',
      release: api,
      ...extra,
    },
    { headers: { 'x-tracelab-worker-release': worker } },
  );
}
function clock() {
  let time = 0;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
    sleep: vi.fn(async (ms: number) => {
      time += ms;
    }),
  };
}
it('verifies both exact releases and only retains allowlisted health evidence', async () => {
  const fetch = vi.fn(async () =>
    health(sha, sha, { credential: 'do-not-log', other: ['sensitive'] }),
  );
  const result = await verifyCloudRelease(sha, { fetch, ...clock() });
  expect(result.bothCommitsVerified).toBe(true);
  expect(result.attempts).toHaveLength(1);
  expect(JSON.stringify(result)).not.toContain('do-not-log');
  expect(result.health).toEqual({
    status: 'ok',
    persistence: 'neon-postgresql',
    imageStorage: 'private-neon',
    release: sha,
  });
});
it.each(['worker', 'api'] as const)(
  'waits for observed %s version skew without changing the expected SHA',
  async (outdated) => {
    const c = clock();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        health(
          outdated === 'api' ? old : sha,
          outdated === 'worker' ? old : sha,
        ),
      )
      .mockResolvedValueOnce(health());
    const result = await verifyCloudRelease(sha, { fetch, ...c });
    expect(result.attempts.map((a) => a.outcome)).toEqual([
      'VERSION_MISMATCH',
      'READY',
    ]);
    expect(result.durationMs).toBe(5000);
    expect(c.sleep).toHaveBeenCalledExactlyOnceWith(5000);
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);
it('fails bounded permanent version skew and retains each safe observation', async () => {
  const fetch = vi.fn(async () => health(sha, old));
  const error = await verifyCloudRelease(sha, { fetch, ...clock() }).catch(
    (e) => e,
  );
  expect(error).toBeInstanceOf(ReleaseVerificationError);
  expect(error.report.bothCommitsVerified).toBe(false);
  expect(error.report.attempts).toHaveLength(18);
  expect(error.report.durationMs).toBe(85000);
  expect(
    error.report.attempts.every(
      (a: { workerRelease: string }) => a.workerRelease === old,
    ),
  ).toBe(true);
});
it.each([
  { status: 'broken' },
  { persistence: 'local-sqlite' },
  { imageStorage: 'public' },
])(
  'rejects unhealthy or inappropriate persistence despite matching SHAs: %j',
  async (extra) => {
    const error = await verifyCloudRelease(sha, {
      fetch: async () => health(sha, sha, extra),
      ...clock(),
    }).catch((e) => e);
    expect(error).toBeInstanceOf(ReleaseVerificationError);
    expect(
      error.report.attempts.every(
        (a: { outcome: string }) => a.outcome === 'HEALTH_MISMATCH',
      ),
    ).toBe(true);
  },
);
it('handles transient HTTP, malformed and network failures without printing provider bodies or errors', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('private diagnostic', { status: 503 }))
    .mockResolvedValueOnce(new Response('{bad'))
    .mockRejectedValueOnce(new Error('secret transport detail'))
    .mockResolvedValueOnce(health());
  const result = await verifyCloudRelease(sha, { fetch, ...clock() });
  expect(result.attempts.map((a) => a.outcome)).toEqual([
    'HTTP_ERROR',
    'INVALID_RESPONSE',
    'NETWORK_ERROR',
    'READY',
  ]);
  expect(JSON.stringify(result)).not.toMatch(
    /private diagnostic|secret transport/,
  );
  for (const [url, options] of fetch.mock.calls) {
    expect(url).toBe(
      'https://tracelabos.sarseej-shrestha.workers.dev/api/health',
    );
    expect(options).toMatchObject({ redirect: 'error', cache: 'no-store' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  }
});
it('bounds a streamed response and cancels its reader before retrying', async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(16385));
    },
    cancel,
  });
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(body))
    .mockResolvedValueOnce(health());
  const result = await verifyCloudRelease(sha, { fetch, ...clock() });
  expect(result.attempts[0]?.outcome).toBe('INVALID_RESPONSE');
  expect(cancel).toHaveBeenCalledOnce();
});
it('does not accept a response completing after the overall deadline or start another probe', async () => {
  const c = clock();
  const fetch = vi.fn(async () => {
    c.advance(90001);
    return health();
  });
  const error = await verifyCloudRelease(sha, { fetch, ...c }).catch((e) => e);
  expect(error).toBeInstanceOf(ReleaseVerificationError);
  expect(error.report.bothCommitsVerified).toBe(false);
  expect(fetch).toHaveBeenCalledOnce();
  expect(c.sleep).not.toHaveBeenCalled();
});
it.each(['', 'main', 'a'.repeat(39), sha + '\n', 'A'.repeat(40)])(
  'rejects invalid selected commit %# before networking',
  async (expected) => {
    const fetch = vi.fn();
    await expect(verifyCloudRelease(expected, { fetch })).rejects.toThrow(
      'full lowercase',
    );
    expect(fetch).not.toHaveBeenCalled();
  },
);
