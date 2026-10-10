import { HISTORY_LIMIT, orderedEvents, type ClassroomEvent } from './replay.ts';

export type HistoryPage = {
  events: ClassroomEvent[];
  through: number;
  total: number;
  nextCursor: number;
  hasMore: boolean;
};
/** Collect a fixed append-only snapshot; never silently present a truncated history. */
export async function loadHistory(
  fetchPage: (after: number, through?: number) => Promise<HistoryPage>,
) {
  let after = 0,
    through: number | undefined,
    total: number | undefined;
  const events: ClassroomEvent[] = [];
  for (let pageNumber = 0; pageNumber < HISTORY_LIMIT / 100; pageNumber++) {
    const page = await fetchPage(after, through);
    if (
      ![page.through, page.total, page.nextCursor].every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      ) ||
      typeof page.hasMore !== 'boolean' ||
      page.total > HISTORY_LIMIT ||
      page.events.length > 100
    )
      throw new Error('INVALID_HISTORY_PAGE');
    if (
      through !== undefined &&
      (page.through !== through || page.total !== total)
    )
      throw new Error('HISTORY_SNAPSHOT_CHANGED');
    through = page.through;
    total = page.total;
    const batch = orderedEvents(page.events);
    if (
      batch.length !== page.events.length ||
      batch.some(
        (event) => event.sequence <= after || event.sequence > through!,
      ) ||
      page.nextCursor !== (batch.at(-1)?.sequence ?? after)
    )
      throw new Error('INVALID_HISTORY_PAGE');
    events.push(...batch);
    if (events.length > total || events.length > HISTORY_LIMIT)
      throw new Error('INVALID_HISTORY_PAGE');
    if (!page.hasMore) {
      const ordered = orderedEvents(events);
      if (ordered.length !== total) throw new Error('INCOMPLETE_HISTORY');
      return { events: ordered, through };
    }
    if (!batch.length || page.nextCursor <= after)
      throw new Error('HISTORY_CURSOR_STALLED');
    after = page.nextCursor;
  }
  throw new Error('HISTORY_LIMIT_EXCEEDED');
}
