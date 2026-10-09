import { createHash, randomUUID } from 'node:crypto';
import type { Database } from '../../../packages/database/src/adapter.ts';
import {
  transition,
  type SubmissionState,
} from '../../../packages/contracts/src/index.ts';
import {
  extract,
  type Extraction,
  type VisionProvider,
} from '../../../packages/vision-adapter/src/index.ts';
import { plainMath } from '../../../packages/vision-adapter/src/latex.ts';
import type { ImageStore } from '../../../packages/vision-adapter/src/storage.ts';
import { readImage } from './images.ts';
const digest = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
type Submission = {
  id: string;
  state: SubmissionState;
  version: number;
  student_id: string;
  classroom_id: string;
  question: string;
};
type Job = {
  id: string;
  submission_id: string;
  input_version: number;
  image_sha256: string;
  provider_version: string;
  status: string;
  attempts: number;
  lease_token: string;
  lease_until: number;
};
export class OcrJobError extends Error {
  constructor(
    public status: 400 | 409 | 429 | 503,
    code: string,
  ) {
    super(code);
  }
}
async function event(
  db: Database,
  s: Submission,
  type: string,
  payload: object,
) {
  await db
    .prepare(
      'INSERT INTO domain_events(id,classroom_id,submission_id,type,payload,created_at) VALUES(?,?,?,?,?,?)',
    )
    .run(
      randomUUID(),
      s.classroom_id,
      s.id,
      type,
      JSON.stringify(payload),
      new Date().toISOString(),
    );
}
async function getSubmission(db: Database, id: string) {
  return (await db
    .prepare(
      'SELECT s.*,a.classroom_id,a.question FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=?',
    )
    .get(id)) as Submission;
}
/** Caller authorizes the student; enqueue participates in the request's atomic transaction. */
export async function enqueueOcr(
  db: Database,
  id: string,
  version: number,
  key: string,
  provider?: VisionProvider,
) {
  return db.transaction(async () => {
    const previous = await db
      .prepare(
        'SELECT id,status,input_version FROM ocr_jobs WHERE submission_id=? AND request_key=?',
      )
      .get(id, key);
    if (previous) {
      if (previous.input_version !== version)
        throw new OcrJobError(409, 'IDEMPOTENCY_CONFLICT');
      return { id: previous.id, status: previous.status, idempotent: true };
    }
    if (!provider) throw new OcrJobError(503, 'OCR_UNAVAILABLE');
    const s = await getSubmission(db, id);
    if (!['MANUAL_ENTRY', 'EXTRACTION_FAILED'].includes(s.state))
      throw new OcrJobError(409, 'OCR_LOCKED');
    if (s.version !== version) throw new OcrJobError(409, 'STALE_VERSION');
    const reference = await db
      .prepare('SELECT sha256 FROM image_references WHERE submission_id=?')
      .get(id);
    const local = reference
      ? undefined
      : await db
          .prepare('SELECT bytes FROM submission_images WHERE submission_id=?')
          .get(id);
    if (!reference && !local) throw new OcrJobError(400, 'IMAGE_REQUIRED');
    const since = new Date(Date.now() - 86400000).toISOString();
    const total = Number(
      (await db
        .prepare('SELECT COUNT(*) n FROM ocr_jobs WHERE created_at>=?')
        .get(since))!.n,
    );
    const user = Number(
      (await db
        .prepare(
          'SELECT COUNT(*) n FROM ocr_jobs j JOIN submissions s ON s.id=j.submission_id WHERE s.student_id=? AND j.created_at>=?',
        )
        .get(s.student_id, since))!.n,
    );
    if (total >= 200 || user >= 5)
      throw new OcrJobError(429, 'OCR_QUOTA_EXHAUSTED');
    const jobId = randomUUID(),
      now = new Date().toISOString();
    await db
      .prepare(
        'INSERT INTO ocr_jobs(id,submission_id,request_key,input_version,image_sha256,provider_version,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',
      )
      .run(
        jobId,
        id,
        key,
        version,
        reference
          ? (reference.sha256 as string)
          : digest(local!.bytes as Uint8Array),
        provider.version,
        'QUEUED',
        now,
        now,
      );
    await db
      .prepare('UPDATE submissions SET state=? WHERE id=?')
      .run(transition(s.state, 'PROCESSING'), id);
    await event(db, s, 'OCR_QUEUED', { jobId });
    return { id: jobId, status: 'QUEUED', idempotent: false };
  });
}
export async function manualEntry(db: Database, id: string, version: number) {
  return db.transaction(async () => {
    const s = await getSubmission(db, id);
    if (s.version !== version) throw new OcrJobError(409, 'STALE_VERSION');
    if (s.state === 'MANUAL_ENTRY') return;
    if (
      !['PROCESSING', 'EXTRACTION_FAILED', 'CONFIRMATION_REQUIRED'].includes(
        s.state,
      )
    )
      throw new OcrJobError(409, 'TRANSCRIPTION_LOCKED');
    await db
      .prepare(
        "UPDATE ocr_jobs SET status='CANCELLED',lease_token=NULL,updated_at=? WHERE submission_id=? AND status IN ('QUEUED','RUNNING')",
      )
      .run(new Date().toISOString(), id);
    await db
      .prepare('UPDATE submissions SET state=? WHERE id=?')
      .run(transition(s.state, 'MANUAL_ENTRY'), id);
    await event(db, s, 'MANUAL_ENTRY_SELECTED', {});
  });
}
/** Claim under the same database write lock used by requests; inference happens after commit. */
export async function claimOcr(
  db: Database,
  providerVersion: string,
  now = Date.now(),
): Promise<Job | undefined> {
  return db.transaction(async () => {
    const job = (await db
      .prepare(
        "SELECT * FROM ocr_jobs WHERE provider_version=? AND ((status='QUEUED' AND available_at<=?) OR (status='RUNNING' AND lease_until<=?)) ORDER BY created_at,id LIMIT 1",
      )
      .get(providerVersion, now, now)) as Job | undefined;
    if (!job) return;
    const s = await getSubmission(db, job.submission_id);
    if (s.state !== 'PROCESSING' || s.version !== job.input_version) {
      await db
        .prepare(
          "UPDATE ocr_jobs SET status='CANCELLED',lease_token=NULL,updated_at=? WHERE id=?",
        )
        .run(new Date(now).toISOString(), job.id);
      return;
    }
    if (job.attempts >= 3) {
      await db
        .prepare(
          "UPDATE ocr_jobs SET status='FAILED',error_code='LEASE_EXHAUSTED',lease_token=NULL,updated_at=? WHERE id=?",
        )
        .run(new Date(now).toISOString(), job.id);
      await db
        .prepare('UPDATE submissions SET state=? WHERE id=?')
        .run(transition(s.state, 'EXTRACTION_FAILED'), s.id);
      await event(db, s, 'OCR_FAILED', {
        jobId: job.id,
        code: 'LEASE_EXHAUSTED',
      });
      return;
    }
    job.attempts++;
    job.lease_token = randomUUID();
    job.lease_until = now + 90000;
    await db
      .prepare(
        "UPDATE ocr_jobs SET status='RUNNING',attempts=?,lease_token=?,lease_until=?,updated_at=? WHERE id=?",
      )
      .run(
        job.attempts,
        job.lease_token,
        job.lease_until,
        new Date(now).toISOString(),
        job.id,
      );
    await event(db, s, 'OCR_STARTED', { jobId: job.id, attempt: job.attempts });
    return job;
  });
}
export async function completeOcr(
  db: Database,
  job: Job,
  result: Extraction,
  now = Date.now(),
) {
  return db.transaction(async () => {
    const current = await db
      .prepare('SELECT status,lease_token,lease_until FROM ocr_jobs WHERE id=?')
      .get(job.id);
    if (
      current?.status !== 'RUNNING' ||
      current.lease_token !== job.lease_token ||
      Number(current.lease_until) <= now
    )
      return false;
    const s = await getSubmission(db, job.submission_id);
    if (s.state !== 'PROCESSING' || s.version !== job.input_version)
      return false;
    if (result.ok) {
      const lines = result.data.lines.map(
        (line) => plainMath(line.latex) ?? line.latex,
      );
      await db
        .prepare('INSERT INTO transcription_versions VALUES(?,?,?,?,?)')
        .run(
          s.id,
          s.version + 1,
          JSON.stringify(lines),
          'ocr',
          new Date(now).toISOString(),
        );
      await db
        .prepare('UPDATE submissions SET state=?,version=version+1 WHERE id=?')
        .run(transition(s.state, 'CONFIRMATION_REQUIRED'), s.id);
      await db
        .prepare(
          "UPDATE ocr_jobs SET status='SUCCEEDED',raw_output=?,error_code=NULL,lease_token=NULL,updated_at=? WHERE id=?",
        )
        .run(JSON.stringify(result.data), new Date(now).toISOString(), job.id);
      await event(db, s, 'OCR_COMPLETED', {
        jobId: job.id,
        version: s.version + 1,
        modelVersion: job.provider_version,
      });
    } else {
      const retry =
        job.attempts < 3 && ['TIMEOUT', 'PROVIDER_ERROR'].includes(result.code);
      await db
        .prepare(
          'UPDATE ocr_jobs SET status=?,error_code=?,lease_token=NULL,available_at=?,updated_at=? WHERE id=?',
        )
        .run(
          retry ? 'QUEUED' : 'FAILED',
          result.code,
          now + 20000 * job.attempts,
          new Date(now).toISOString(),
          job.id,
        );
      if (!retry)
        await db
          .prepare('UPDATE submissions SET state=? WHERE id=?')
          .run(transition(s.state, 'EXTRACTION_FAILED'), s.id);
      await event(db, s, retry ? 'OCR_RETRY_SCHEDULED' : 'OCR_FAILED', {
        jobId: job.id,
        code: result.code,
      });
    }
    return true;
  });
}
/** One bounded job per call. Queue state survives process restarts; no request waits for inference. */
export async function runOcrJob(
  db: Database,
  provider: VisionProvider,
  store?: ImageStore,
) {
  const job = await claimOcr(db, provider.version);
  if (!job) return false;
  let result: Extraction;
  try {
    const image = await readImage(db, store, job.submission_id);
    if (!image || digest(image.bytes) !== job.image_sha256)
      result = { ok: false, code: 'INVALID_OUTPUT', manualEntry: true };
    else {
      const s = await getSubmission(db, job.submission_id);
      result = await extract(
        provider,
        image.bytes,
        (JSON.parse(s.question) as { id: string }).id,
        30000,
      );
    }
  } catch {
    result = { ok: false, code: 'PROVIDER_ERROR', manualEntry: true };
  }
  await completeOcr(db, job, result);
  return true;
}
