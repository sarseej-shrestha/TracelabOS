import { createHash, randomUUID } from 'node:crypto';
import type { Database } from '../../../packages/database/src/adapter.ts';
import {
  imagePrefix,
  StorageUnavailable,
  type ImageStore,
} from '../../../packages/vision-adapter/src/storage.ts';
const digest = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
export async function saveImage(
  db: Database,
  store: ImageStore | undefined,
  submissionId: string,
  bytes: Uint8Array,
) {
  if (store) {
    const key = `${imagePrefix}${submissionId}/${randomUUID()}.jpg`;
    await store.put(key, bytes);
    // Keep immutable objects until reconciliation. An interrupted DB commit can leave an orphan, never a dangling replacement of the previous object.
    await db
      .prepare(
        'INSERT INTO image_references VALUES(?,?,?,?,?,?) ON CONFLICT(submission_id) DO UPDATE SET object_key=excluded.object_key,mime=excluded.mime,byte_length=excluded.byte_length,sha256=excluded.sha256,created_at=excluded.created_at',
      )
      .run(
        submissionId,
        key,
        'image/jpeg',
        bytes.length,
        digest(bytes),
        new Date().toISOString(),
      );
    await db
      .prepare('DELETE FROM submission_images WHERE submission_id=?')
      .run(submissionId);
  } else {
    if (
      await db
        .prepare('SELECT 1 FROM image_references WHERE submission_id=?')
        .get(submissionId)
    )
      throw new StorageUnavailable();
    await db
      .prepare(
        'INSERT INTO submission_images VALUES(?,?,?) ON CONFLICT(submission_id) DO UPDATE SET mime=excluded.mime,bytes=excluded.bytes',
      )
      .run(submissionId, 'image/jpeg', bytes);
  }
}
export async function readImage(
  db: Database,
  store: ImageStore | undefined,
  submissionId: string,
) {
  const reference = await db
    .prepare('SELECT * FROM image_references WHERE submission_id=?')
    .get(submissionId);
  if (reference) {
    if (!store) throw new StorageUnavailable();
    const bytes = await store.get(reference.object_key as string);
    if (
      bytes.length !== reference.byte_length ||
      digest(bytes) !== reference.sha256
    )
      throw new StorageUnavailable();
    return { bytes, mime: 'image/jpeg' };
  }
  return (await db
    .prepare('SELECT * FROM submission_images WHERE submission_id=?')
    .get(submissionId)) as { bytes: Uint8Array; mime: string } | undefined;
}
/** Dry-run by default. Re-check under the write transaction so active uploads cannot race deletion. */
export async function reconcileImages(
  db: Database,
  store: ImageStore,
  options: { apply?: boolean; now?: number; maxPages?: number } = {},
) {
  const cutoff = (options.now ?? Date.now()) - 24 * 3600000;
  let cursor: string | undefined;
  let candidates = 0,
    deleted = 0,
    scanned = 0;
  const maxPages = options.maxPages ?? 10;
  for (let page = 0; page < maxPages; page++) {
    const listing = await store.list(cursor);
    for (const object of listing.objects) {
      scanned++;
      if (
        !object.key.startsWith(imagePrefix) ||
        object.modified.getTime() >= cutoff
      )
        continue;
      await db.transaction(async () => {
        if (
          await db
            .prepare('SELECT 1 FROM image_references WHERE object_key=?')
            .get(object.key)
        )
          return;
        candidates++;
        if (options.apply) {
          await store.delete(object.key);
          deleted++;
        }
      });
    }
    cursor = listing.cursor;
    if (!cursor) break;
  }
  return { scanned, candidates, deleted, more: !!cursor };
}

/** Move existing private database bytes in bounded batches; every source row survives a failed upload. */
export async function migrateStoredImages(
  db: Database,
  store: ImageStore,
  apply = false,
) {
  const rows = await db
    .prepare('SELECT submission_id FROM submission_images LIMIT 100')
    .all();
  let migrated = 0;
  if (apply)
    for (const row of rows) {
      await db.transaction(async () => {
        const image = await db
          .prepare('SELECT bytes FROM submission_images WHERE submission_id=?')
          .get(row.submission_id as string);
        if (!image) return;
        if (
          await db
            .prepare('SELECT 1 FROM image_references WHERE submission_id=?')
            .get(row.submission_id as string)
        )
          throw new Error('Conflicting image sources require review');
        await saveImage(
          db,
          store,
          row.submission_id as string,
          image.bytes as Uint8Array,
        );
        migrated++;
      });
    }
  const remaining = Number(
    (await db.prepare('SELECT COUNT(*) n FROM submission_images').get())?.n,
  );
  return { candidates: rows.length, migrated, remaining };
}
