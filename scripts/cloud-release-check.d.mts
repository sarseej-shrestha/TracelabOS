export interface ReleaseAttempt {
  elapsedMs: number;
  status: number | null;
  apiRelease: string | null;
  workerRelease: string | null;
  outcome: string;
}
export interface ReleaseReport {
  release: string;
  worker: string;
  health?: {
    status: string;
    persistence: string;
    imageStorage: string;
    release: string;
  };
  bothCommitsVerified: boolean;
  durationMs: number;
  attempts: ReleaseAttempt[];
}
export class ReleaseVerificationError extends Error {
  report: ReleaseReport;
}
export function verifyCloudRelease(
  expected: string,
  dependencies?: {
    fetch?: typeof globalThis.fetch;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<ReleaseReport>;
