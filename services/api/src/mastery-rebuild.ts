import type {
  Database,
  Row,
  Value,
} from '../../../packages/database/src/adapter.ts';
import { skills } from '../../../packages/question-bank/src/index.ts';
import {
  estimateMastery,
  MASTERY_VERSION,
} from '../../../packages/learning-engine/src/mastery.ts';
type Evidence = {
  submission_id: string;
  classroom_id: string;
  student_id: string;
  skill_id: string;
  review_id: string;
  evaluation_id: string;
  outcome: number | null;
  observed_at: string;
  updated_at: string;
};
const validTimestamp = (value: unknown) =>
  typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const scopeKey = (row: Row) =>
  JSON.stringify([row.classroom_id, row.student_id, row.skill_id]);
const changed = (
  expected: Row[],
  existing: Row[],
  key: (row: Row) => string,
) => {
  const previous = new Map(existing.map((row) => [key(row), row]));
  let inserted = 0,
    updated = 0;
  for (const row of expected) {
    const old = previous.get(key(row));
    if (!old) inserted++;
    else if (Object.keys(row).some((column) => row[column] !== old[column]))
      updated++;
    previous.delete(key(row));
  }
  return { inserted, updated, removed: previous.size };
};
/** Operational projection only. Source reviews, grading and intervention snapshots are immutable. */
export async function rebuildMastery(db: Database, apply = false) {
  return db.transaction(async () => {
    // This operation requires existing migrations and never changes the schema.
    if (
      !(await db
        .prepare('SELECT 1 FROM schema_migrations WHERE version=4')
        .get())
    )
      throw new Error('MASTERY_MIGRATION_REQUIRED');
    const reviews = await db
      .prepare(
        `SELECT s.id submission_id,s.student_id,a.classroom_id,a.question,r.id review_id,r.decision,r.created_at reviewed_at,e.id evaluation_id,e.created_at observed_at
      FROM submissions s JOIN assignments a ON a.id=s.assignment_id JOIN teacher_reviews r ON r.submission_id=s.id
      LEFT JOIN evaluations e ON e.id=(SELECT e2.id FROM evaluations e2 WHERE e2.submission_id=s.id AND e2.created_at<=r.created_at ORDER BY e2.created_at DESC,e2.id DESC LIMIT 1)
      WHERE s.state='FINALIZED' AND r.rowid=(SELECT MAX(r2.rowid) FROM teacher_reviews r2 WHERE r2.submission_id=s.id)
      ORDER BY s.id LIMIT 10001`,
      )
      .all();
    if (reviews.length > 10000) throw new Error('REBUILD_LIMIT_EXCEEDED');
    const blocked: Record<string, number> = {};
    const evidence: Evidence[] = [];
    for (const row of reviews) {
      let skillId: unknown;
      try {
        skillId = JSON.parse(row.question as string)?.skillId;
      } catch {
        /* Classified below without exposing the source. */
      }
      const error = !skills.some((skill) => skill.id === skillId)
        ? 'UNKNOWN_OR_INVALID_SKILL'
        : !validTimestamp(row.reviewed_at) ||
            (row.observed_at !== null && !validTimestamp(row.observed_at))
          ? 'INVALID_EVIDENCE_TIMESTAMP'
          : !row.evaluation_id
            ? 'MISSING_REVIEWED_EVALUATION'
            : !['correct', 'needs_practice', 'requires_review'].includes(
                  row.decision as string,
                )
              ? 'INVALID_REVIEW_DECISION'
              : null;
      if (error) {
        blocked[error] = (blocked[error] ?? 0) + 1;
        continue;
      }
      evidence.push({
        submission_id: row.submission_id as string,
        classroom_id: row.classroom_id as string,
        student_id: row.student_id as string,
        skill_id: skillId as string,
        review_id: row.review_id as string,
        evaluation_id: row.evaluation_id as string,
        outcome:
          row.decision === 'requires_review'
            ? null
            : row.decision === 'correct'
              ? 1
              : 0,
        observed_at: row.observed_at as string,
        updated_at: row.reviewed_at as string,
      });
    }
    const groups = new Map<string, Evidence[]>();
    for (const row of evidence) {
      const key = scopeKey(row);
      const group = groups.get(key) ?? [];
      group.push(row);
      groups.set(key, group);
    }
    const estimates = [...groups.values()].map((group) => {
      group.sort(
        (a, b) =>
          a.observed_at.localeCompare(b.observed_at) ||
          a.submission_id.localeCompare(b.submission_id),
      );
      const estimate = estimateMastery(
        group
          .filter((row) => row.outcome !== null)
          .map((row) => row.outcome === 1),
      );
      const first = group[0]!;
      return {
        classroom_id: first.classroom_id,
        student_id: first.student_id,
        skill_id: first.skill_id,
        algorithm_version: MASTERY_VERSION,
        probability: estimate.probability,
        evidence_count: estimate.evidenceCount,
        correct_count: estimate.correctCount,
        updated_at: group
          .map((row) => row.updated_at)
          .sort()
          .at(-1)!,
      };
    });
    const changes = {
      evidence: changed(
        evidence,
        await db.prepare('SELECT * FROM mastery_evidence').all(),
        (row) => row.submission_id as string,
      ),
      estimates: changed(
        estimates,
        await db
          .prepare('SELECT * FROM mastery_estimates WHERE algorithm_version=?')
          .all(MASTERY_VERSION),
        scopeKey,
      ),
    };
    const hasChanges = Object.values(changes).some((change) =>
      Object.values(change).some((count) => count > 0),
    );
    if (apply && Object.keys(blocked).length)
      throw new Error('REBUILD_BLOCKED_INVALID_EVIDENCE');
    if (apply && hasChanges) {
      await db.prepare('DELETE FROM mastery_evidence').run();
      await db
        .prepare('DELETE FROM mastery_estimates WHERE algorithm_version=?')
        .run(MASTERY_VERSION);
      for (const [table, records] of [
        ['mastery_evidence', evidence],
        ['mastery_estimates', estimates],
      ] as const) {
        for (const row of records) {
          const columns = Object.keys(row);
          await db
            .prepare(
              `INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
            )
            .run(...(Object.values(row) as Value[]));
        }
      }
    }
    return {
      mode: apply ? 'apply' : 'dry-run',
      algorithmVersion: MASTERY_VERSION,
      reviewedSubmissions: reviews.length,
      evidenceItems: evidence.length,
      estimateScopes: estimates.length,
      changes,
      blocked,
      applied: apply && hasChanges,
    };
  }, apply);
}
