import type { Database } from '../../../packages/database/src/adapter.ts';
import {
  estimateMastery,
  MASTERY_VERSION,
  MIN_EVIDENCE,
  READY_THRESHOLD,
} from '../../../packages/learning-engine/src/mastery.ts';
import { skills } from '../../../packages/question-bank/src/index.ts';

/** Called inside the same transaction as the immutable teacher review and release event. */
export async function recordMasteryReview(
  db: Database,
  submission: { id: string; classroom_id: string; student_id: string },
  skillId: string,
  reviewId: string,
  decision: 'correct' | 'needs_practice' | 'requires_review',
  timestamp: string,
) {
  // Historical/unsupported catalogue entries stay reviewable without inventing a skill mapping.
  if (!skills.some((s) => s.id === skillId)) return;
  const evaluation = await db
    .prepare(
      'SELECT id,created_at FROM evaluations WHERE submission_id=? ORDER BY created_at DESC,id DESC LIMIT 1',
    )
    .get(submission.id);
  if (!evaluation) throw new Error('MISSING_REVIEW_EVALUATION');
  await db
    .prepare(
      `INSERT INTO mastery_evidence(submission_id,classroom_id,student_id,skill_id,review_id,evaluation_id,outcome,observed_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
    ON CONFLICT(submission_id) DO UPDATE SET review_id=excluded.review_id, evaluation_id=excluded.evaluation_id, outcome=excluded.outcome, updated_at=excluded.updated_at`,
    )
    .run(
      submission.id,
      submission.classroom_id,
      submission.student_id,
      skillId,
      reviewId,
      evaluation.id as string,
      decision === 'requires_review' ? null : decision === 'correct' ? 1 : 0,
      evaluation.created_at as string,
      timestamp,
    );
  const scope = [submission.classroom_id, submission.student_id, skillId];
  const rows = await db
    .prepare(
      'SELECT outcome FROM mastery_evidence WHERE classroom_id=? AND student_id=? AND skill_id=? AND outcome IS NOT NULL ORDER BY observed_at,submission_id',
    )
    .all(...scope);
  const estimate = estimateMastery(rows.map((row) => row.outcome === 1));
  await db
    .prepare(
      `INSERT INTO mastery_estimates(classroom_id,student_id,skill_id,algorithm_version,probability,evidence_count,correct_count,updated_at) VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(classroom_id,student_id,skill_id,algorithm_version) DO UPDATE SET probability=excluded.probability,evidence_count=excluded.evidence_count,correct_count=excluded.correct_count,updated_at=excluded.updated_at`,
    )
    .run(
      ...scope,
      MASTERY_VERSION,
      estimate.probability,
      estimate.evidenceCount,
      estimate.correctCount,
      timestamp,
    );
}
export async function masteredSkills(
  db: Database,
  classroomId: string,
  studentId: string,
) {
  const rows = await db
    .prepare(
      'SELECT skill_id FROM mastery_estimates WHERE classroom_id=? AND student_id=? AND algorithm_version=? AND evidence_count>=? AND probability>=?',
    )
    .all(
      classroomId,
      studentId,
      MASTERY_VERSION,
      MIN_EVIDENCE,
      READY_THRESHOLD,
    );
  return new Set(rows.map((row) => row.skill_id as string));
}
export async function masteryProgress(
  db: Database,
  classroomId: string,
  studentId: string,
) {
  const rows = await db
    .prepare(
      'SELECT * FROM mastery_estimates WHERE classroom_id=? AND student_id=? AND algorithm_version=? ORDER BY skill_id',
    )
    .all(classroomId, studentId, MASTERY_VERSION);
  return rows.map((row) => ({
    skillId: row.skill_id as string,
    title:
      skills.find((skill) => skill.id === row.skill_id)?.title ??
      (row.skill_id as string),
    probability: row.probability as number,
    evidenceCount: row.evidence_count as number,
    correctCount: row.correct_count as number,
    algorithmVersion: row.algorithm_version as string,
    status:
      Number(row.evidence_count) < MIN_EVIDENCE
        ? 'insufficient_evidence'
        : Number(row.probability) >= READY_THRESHOLD
          ? 'ready_to_practice_further'
          : 'developing',
    updatedAt: row.updated_at as string,
  }));
}
