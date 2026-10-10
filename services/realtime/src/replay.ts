import { z } from 'zod';
import {
  states,
  transitions,
  type SubmissionState,
} from '../../../packages/contracts/src/index.ts';

export const REPLAY_VERSION = 'classroom-milestones-1';
export const HISTORY_LIMIT = 10000;
const eventSchema = z.object({
  sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  id: z.string().uuid(),
  submission_id: z.string().uuid().nullable(),
  type: z.string().min(1).max(80),
  created_at: z.iso.datetime(),
  payload: z.record(z.string(), z.unknown()),
});
export type ClassroomEvent = z.infer<typeof eventSchema>;
const payloadKeys = [
  'assignmentId',
  'state',
  'decision',
  'version',
  'jobId',
  'attempt',
  'modelVersion',
  'code',
] as const;
/** Metadata projection deliberately excludes images, transcription, names and future fields. */
export function projectEvent(value: unknown): ClassroomEvent {
  const event = eventSchema.parse(value);
  const payload: Record<string, string | number> = {};
  for (const key of payloadKeys) {
    const item = event.payload[key];
    if (typeof item === 'string' && item.length <= 100) payload[key] = item;
    else if (
      typeof item === 'number' &&
      Number.isSafeInteger(item) &&
      item >= 0
    )
      payload[key] = item;
  }
  return { ...event, payload };
}
/** Global sequence gaps are normal: other classrooms use the same database sequence. */
export function orderedEvents(input: readonly ClassroomEvent[]) {
  if (input.length > HISTORY_LIMIT) throw new Error('HISTORY_LIMIT_EXCEEDED');
  const byId = new Map<string, ClassroomEvent>(),
    bySequence = new Map<number, string>();
  for (const value of input) {
    const event = projectEvent(value),
      previous = byId.get(event.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(event))
      throw new Error('CONFLICTING_EVENT_ID');
    if (
      bySequence.has(event.sequence) &&
      bySequence.get(event.sequence) !== event.id
    )
      throw new Error('CONFLICTING_EVENT_SEQUENCE');
    byId.set(event.id, event);
    bySequence.set(event.sequence, event.id);
  }
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}
type Decision = 'correct' | 'needs_practice' | 'requires_review';
type ObservedSubmission = {
  id: string;
  state: SubmissionState;
  startObserved: boolean;
  decision: Decision | null;
  lastSequence: number;
};
const fixedStates: Record<string, SubmissionState> = {
  OCR_QUEUED: 'PROCESSING',
  OCR_STARTED: 'PROCESSING',
  OCR_RETRY_SCHEDULED: 'PROCESSING',
  OCR_COMPLETED: 'CONFIRMATION_REQUIRED',
  OCR_FAILED: 'EXTRACTION_FAILED',
  MANUAL_ENTRY_SELECTED: 'MANUAL_ENTRY',
  TRANSCRIPTION_CONFIRMED: 'CONFIRMED',
  FEEDBACK_RELEASED: 'FINALIZED',
};
export function replayClassroom(
  input: readonly ClassroomEvent[],
  position?: number,
) {
  const ordered = orderedEvents(input);
  const count = position ?? ordered.length;
  if (!Number.isSafeInteger(count) || count < 0 || count > ordered.length)
    throw new Error('INVALID_REPLAY_POSITION');
  const assignments = new Set<string>(),
    submissions = new Map<string, ObservedSubmission>();
  const warnings: { sequence: number; code: string }[] = [];
  const events = ordered.slice(0, count);
  for (const event of events) {
    const warn = (code: string) =>
      warnings.push({ sequence: event.sequence, code });
    if (
      event.type === 'ASSIGNMENT_PUBLISHED' ||
      event.type === 'REMEDIATION_ASSIGNED'
    ) {
      const assignment = z
        .string()
        .uuid()
        .safeParse(event.payload.assignmentId);
      if (!assignment.success) {
        warn('INVALID_PAYLOAD');
        continue;
      }
      if (event.type === 'ASSIGNMENT_PUBLISHED')
        assignments.add(assignment.data);
      continue;
    }
    let next: SubmissionState | undefined;
    if (
      event.type === 'SUBMISSION_RECEIVED' ||
      event.type === 'EVALUATION_COMPLETED'
    ) {
      const state = z.enum(states).safeParse(event.payload.state);
      const allowed =
        event.type === 'SUBMISSION_RECEIVED'
          ? ['MANUAL_ENTRY', 'CREATED']
          : ['EVALUATED', 'TEACHER_REVIEW'];
      if (!state.success || !allowed.includes(state.data)) {
        warn('INVALID_PAYLOAD');
        continue;
      }
      next = state.data;
    } else if (Object.hasOwn(fixedStates, event.type))
      next = fixedStates[event.type];
    else {
      warn('UNKNOWN_EVENT');
      continue;
    }
    if (!event.submission_id || !next) {
      warn('MISSING_SUBMISSION_ID');
      continue;
    }
    let decision: Decision | undefined;
    if (event.type === 'FEEDBACK_RELEASED') {
      const parsed = z
        .enum(['correct', 'needs_practice', 'requires_review'])
        .safeParse(event.payload.decision);
      if (!parsed.success) {
        warn('INVALID_PAYLOAD');
        continue;
      }
      decision = parsed.data;
    }
    const previous = submissions.get(event.submission_id);
    if (!previous && event.type !== 'SUBMISSION_RECEIVED')
      warn('MISSING_SUBMISSION_START');
    if (previous && event.type === 'SUBMISSION_RECEIVED') {
      warn('DUPLICATE_SUBMISSION_START');
      continue;
    }
    if (
      previous &&
      previous.state !== next &&
      !transitions[previous.state].includes(next)
    )
      warn('UNOBSERVED_TRANSITION');
    submissions.set(event.submission_id, {
      id: event.submission_id,
      state: next,
      startObserved:
        previous?.startObserved ?? event.type === 'SUBMISSION_RECEIVED',
      decision: decision ?? previous?.decision ?? null,
      lastSequence: event.sequence,
    });
  }
  const observed = [...submissions.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  return {
    version: REPLAY_VERSION,
    position: count,
    through: events.at(-1)?.sequence ?? 0,
    assignments: [...assignments].sort(),
    submissions: observed,
    states: states
      .map((state) => ({
        state,
        count: observed.filter((item) => item.state === state).length,
      }))
      .filter((item) => item.count > 0),
    decisions: (['correct', 'needs_practice', 'requires_review'] as const)
      .map((decision) => ({
        decision,
        count: observed.filter((item) => item.decision === decision).length,
      }))
      .filter((item) => item.count > 0),
    warnings,
  };
}
