import { z } from 'zod';
import type { Database } from '../../../packages/database/src/adapter.ts';
import { projectEvent, HISTORY_LIMIT } from '../../realtime/src/replay.ts';

const cursor = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
/** Caller authorizes the teacher; its request transaction provides a consistent page. */
export async function eventHistory(
  db: Database,
  classroomId: string,
  query: { after?: string; through?: string },
) {
  const after = cursor.parse(query.after ?? 0);
  const maximum = await db
    .prepare(
      'SELECT COALESCE(MAX(sequence),0) value FROM domain_events WHERE classroom_id=?',
    )
    .get(classroomId);
  const latest = Number(maximum!.value);
  const through =
    query.through === undefined ? latest : cursor.parse(query.through);
  if (after > through || through > latest)
    throw new Error('INVALID_HISTORY_CURSOR');
  const result = await db
    .prepare(
      'SELECT CAST(COUNT(*) AS INTEGER) value FROM domain_events WHERE classroom_id=? AND sequence<=?',
    )
    .get(classroomId, through);
  const total = Number(result!.value);
  if (total > HISTORY_LIMIT) throw new Error('HISTORY_LIMIT_EXCEEDED');
  const rows = await db
    .prepare(
      'SELECT sequence,id,submission_id,type,payload,created_at FROM domain_events WHERE classroom_id=? AND sequence>? AND sequence<=? ORDER BY sequence LIMIT 101',
    )
    .all(classroomId, after, through);
  const events = rows
    .slice(0, 100)
    .map((row) =>
      projectEvent({ ...row, payload: JSON.parse(row.payload as string) }),
    );
  return {
    events,
    through,
    total,
    nextCursor: events.at(-1)?.sequence ?? after,
    hasMore: rows.length > 100,
  };
}
export type EventHistoryPage = Awaited<ReturnType<typeof eventHistory>>;
