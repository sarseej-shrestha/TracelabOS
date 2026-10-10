import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  orderedEvents,
  projectEvent,
  replayClassroom,
  type ClassroomEvent,
} from '../../services/realtime/src/replay.ts';
import {
  loadHistory,
  type HistoryPage,
} from '../../services/realtime/src/history.ts';

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const submission = id(500),
  assignment = id(600);
const event = (
  sequence: number,
  type: string,
  payload: Record<string, unknown> = {},
  subject: string | null = submission,
): ClassroomEvent => ({
  sequence,
  id: id(sequence),
  type,
  payload,
  submission_id: subject,
  created_at: '2026-10-10T00:00:00.000Z',
});
const history = [
  event(2, 'ASSIGNMENT_PUBLISHED', { assignmentId: assignment }, null),
  event(7, 'SUBMISSION_RECEIVED', { state: 'MANUAL_ENTRY' }),
  event(11, 'TRANSCRIPTION_CONFIRMED', { version: 1 }),
  event(15, 'EVALUATION_COMPLETED', { state: 'EVALUATED' }),
  event(20, 'FEEDBACK_RELEASED', {
    state: 'FINALIZED',
    decision: 'needs_practice',
  }),
  event(23, 'FEEDBACK_RELEASED', { state: 'FINALIZED', decision: 'correct' }),
];

describe('deterministic milestone replay', () => {
  it('reconstructs each prefix and replaces corrected decisions without inflating submissions', () => {
    expect(replayClassroom(history, 0).submissions).toEqual([]);
    expect(replayClassroom(history, 1).assignments).toEqual([assignment]);
    expect(replayClassroom(history, 2).states).toEqual([
      { state: 'MANUAL_ENTRY', count: 1 },
    ]);
    expect(replayClassroom(history, 3).states).toEqual([
      { state: 'CONFIRMED', count: 1 },
    ]);
    expect(replayClassroom(history, 4).decisions).toEqual([]);
    expect(replayClassroom(history, 5).decisions).toEqual([
      { decision: 'needs_practice', count: 1 },
    ]);
    const last = replayClassroom(history);
    expect(last.decisions).toEqual([{ decision: 'correct', count: 1 }]);
    expect(last.submissions).toHaveLength(1);
    expect(last.submissions[0]!.startObserved).toBe(true);
    expect(last.through).toBe(23);
    expect(last.warnings).toEqual([]);
  });
  it('uses sequence, not timestamps, and accepts normal global gaps', () => {
    const shuffled = history
      .map((item, i) => ({
        ...item,
        created_at: `2026-10-10T00:00:0${5 - i}.000Z`,
      }))
      .reverse();
    expect(replayClassroom(shuffled)).toEqual(replayClassroom(history));
  });
  it('is invariant to reordered delivery and duplicate events across 500 seeded cases', () => {
    const expected = replayClassroom(history);
    fc.assert(
      fc.property(
        fc.shuffledSubarray(history, {
          minLength: history.length,
          maxLength: history.length,
        }),
        fc.array(fc.integer({ min: 0, max: history.length - 1 }), {
          maxLength: 20,
        }),
        (permutation, duplicates) => {
          expect(
            replayClassroom([
              ...permutation,
              ...duplicates.map((i) => history[i]!),
            ]),
          ).toEqual(expected);
        },
      ),
      { seed: 20261010, numRuns: 500 },
    );
  });
  it('projects metadata before comparison and cannot broadcast private or future fields', () => {
    const input = {
      ...history[4]!,
      payload: {
        decision: 'needs_practice',
        state: 'FINALIZED',
        photo: 'private bytes',
        lines: ['secret'],
        studentName: 'private',
      },
      secret: 'private',
    };
    expect(projectEvent(input)).toEqual(history[4]);
    expect(orderedEvents([history[4]!, input])).toHaveLength(1);
  });
  it('rejects identity conflicts instead of choosing an arrival-order winner', () => {
    expect(() =>
      orderedEvents([history[0]!, { ...history[0]!, type: 'DIFFERENT' }]),
    ).toThrow('CONFLICTING_EVENT_ID');
    expect(() =>
      orderedEvents([history[0]!, { ...history[0]!, id: id(100) }]),
    ).toThrow('CONFLICTING_EVENT_SEQUENCE');
    expect(() =>
      orderedEvents([history[0]!, { ...history[0]!, sequence: 100 }]),
    ).toThrow('CONFLICTING_EVENT_ID');
  });
  it('marks absent starts and unobserved transitions without inventing earlier states', () => {
    const missingStart = replayClassroom(history.slice(3));
    expect(missingStart.warnings).toEqual([
      { sequence: 15, code: 'MISSING_SUBMISSION_START' },
    ]);
    expect(missingStart.submissions[0]!.startObserved).toBe(false);
    const missingConfirmation = replayClassroom([history[1]!, history[3]!]);
    expect(missingConfirmation.warnings).toEqual([
      { sequence: 15, code: 'UNOBSERVED_TRANSITION' },
    ]);
    expect(missingConfirmation.states).toEqual([
      { state: 'EVALUATED', count: 1 },
    ]);
  });
  it('reports unknown and invalid events, preserving the last meaningful state', () => {
    const result = replayClassroom([
      history[1]!,
      event(30, 'FUTURE_EVENT', { state: 'FINALIZED' }),
      event(31, 'EVALUATION_COMPLETED', { state: 'invented' }),
      event(32, 'FEEDBACK_RELEASED', { decision: 'invented' }),
      event(33, 'TRANSCRIPTION_CONFIRMED', {}, null),
      event(34, 'ASSIGNMENT_PUBLISHED', { assignmentId: 'invalid' }, null),
      event(35, 'SUBMISSION_RECEIVED', { state: 'MANUAL_ENTRY' }),
    ]);
    expect(result.states).toEqual([{ state: 'MANUAL_ENTRY', count: 1 }]);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'UNKNOWN_EVENT',
      'INVALID_PAYLOAD',
      'INVALID_PAYLOAD',
      'MISSING_SUBMISSION_ID',
      'INVALID_PAYLOAD',
      'DUPLICATE_SUBMISSION_START',
    ]);
  });
  it('replays OCR retries, failure, manual recovery and later confirmation', () => {
    const types = [
      'OCR_QUEUED',
      'OCR_STARTED',
      'OCR_RETRY_SCHEDULED',
      'OCR_STARTED',
      'OCR_FAILED',
      'MANUAL_ENTRY_SELECTED',
      'OCR_QUEUED',
      'OCR_COMPLETED',
      'MANUAL_ENTRY_SELECTED',
      'TRANSCRIPTION_CONFIRMED',
    ];
    const result = replayClassroom([
      history[1]!,
      ...types.map((type, index) => event(40 + index, type)),
    ]);
    expect(result.states).toEqual([{ state: 'CONFIRMED', count: 1 }]);
    expect(result.warnings).toEqual([]);
  });
  it.each([-1, 0.5, 7, NaN, Infinity])(
    'rejects invalid replay position %s',
    (position) => {
      expect(() => replayClassroom(history, position)).toThrow(
        'INVALID_REPLAY_POSITION',
      );
    },
  );
  it('rejects unsafe event metadata and excessive input', () => {
    expect(() =>
      projectEvent({ ...history[0], sequence: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow();
    expect(() =>
      projectEvent({ ...history[0], created_at: 'yesterday' }),
    ).toThrow();
    expect(() => orderedEvents(Array(10001).fill(history[0]))).toThrow(
      'HISTORY_LIMIT_EXCEEDED',
    );
  });
});

describe('snapshot history loading', () => {
  const page = (events: ClassroomEvent[], hasMore = false): HistoryPage => ({
    events,
    through: 23,
    total: history.length,
    nextCursor: events.at(-1)?.sequence ?? 0,
    hasMore,
  });
  it('pins the first page cursor, joins pages and excludes subsequent appends', async () => {
    const calls: [number, number | undefined][] = [];
    const result = await loadHistory(async (after, through) => {
      calls.push([after, through]);
      return after === 0
        ? page(history.slice(0, 3), true)
        : page(history.slice(3));
    });
    expect(calls).toEqual([
      [0, undefined],
      [11, 23],
    ]);
    expect(result).toEqual({ events: history, through: 23 });
  });
  it('supports a genuinely empty snapshot', async () => {
    expect(
      await loadHistory(async () => ({
        events: [],
        total: 0,
        through: 0,
        nextCursor: 0,
        hasMore: false,
      })),
    ).toEqual({ events: [], through: 0 });
  });
  it('rejects missing data even when the server says there are no more pages', async () => {
    await expect(
      loadHistory(async () => page(history.slice(1))),
    ).rejects.toThrow('INCOMPLETE_HISTORY');
  });
  it.each(['through', 'total'] as const)(
    'rejects changed snapshot %s',
    async (field) => {
      await expect(
        loadHistory(async (after) =>
          after === 0
            ? page(history.slice(0, 2), true)
            : { ...page(history.slice(2)), [field]: 999 },
        ),
      ).rejects.toThrow('HISTORY_SNAPSHOT_CHANGED');
    },
  );
  it.each([
    { nextCursor: 999 },
    { hasMore: 'yes' },
    { total: 10001 },
    { total: -1 },
    { through: 1 },
    { events: [history[0], history[0]] },
  ])('rejects inconsistent pagination %j', async (override) => {
    await expect(
      loadHistory(
        async () => ({ ...page(history), ...override }) as HistoryPage,
      ),
    ).rejects.toThrow('INVALID_HISTORY_PAGE');
  });
  it('rejects stalled pagination and propagates network errors', async () => {
    await expect(loadHistory(async () => page([], true))).rejects.toThrow(
      'HISTORY_CURSOR_STALLED',
    );
    await expect(
      loadHistory(async () => {
        throw new Error('NETWORK_ERROR');
      }),
    ).rejects.toThrow('NETWORK_ERROR');
  });
});
