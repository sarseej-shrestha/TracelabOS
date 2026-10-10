import { createHash, randomUUID } from 'node:crypto';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../../../packages/database/src/adapter.ts';
import {
  generateQuestion,
  skills,
  type Question,
} from '../../../packages/question-bank/src/index.ts';
import { recommend } from '../../../packages/learning-engine/src/index.ts';
import {
  BKT_PARAMETERS,
  MASTERY_VERSION,
} from '../../../packages/learning-engine/src/mastery.ts';
import type { Evaluation } from '../../../packages/math-engine/src/index.ts';
import { masteredSkills, masteryProgress } from './mastery.ts';

/** Caller authorizes classroom ownership; caller transaction includes publication events. */
export async function assignRemediation(
  db: Database,
  source: {
    id: string;
    student_id: string;
    classroom_id: string;
    question: string;
    state: string;
  },
  teacherId: string,
  reviewId: string,
) {
  const existing = await db
    .prepare(
      'SELECT assignment_id FROM recommendations WHERE source_submission_id=?',
    )
    .get(source.id);
  if (existing)
    return { id: existing.assignment_id as string, idempotent: true };
  const review = await db
    .prepare(
      'SELECT id,decision FROM teacher_reviews WHERE submission_id=? ORDER BY rowid DESC LIMIT 1',
    )
    .get(source.id);
  if (
    !review ||
    source.state !== 'FINALIZED' ||
    review.decision !== 'needs_practice'
  )
    throw new HTTPException(409, { message: 'PRACTICE_REVIEW_REQUIRED' });
  if (review.id !== reviewId)
    throw new HTTPException(409, { message: 'STALE_REVIEW' });
  if (
    !(await db
      .prepare(
        'SELECT 1 FROM classroom_memberships WHERE classroom_id=? AND user_id=?',
      )
      .get(source.classroom_id, source.student_id))
  )
    throw new HTTPException(409, { message: 'STUDENT_NOT_ENROLLED' });
  const evaluation = await db
    .prepare(
      'SELECT id,result FROM evaluations WHERE submission_id=? ORDER BY created_at DESC,id DESC LIMIT 1',
    )
    .get(source.id);
  if (!evaluation) throw new Error('MISSING_REMEDIATION_EVALUATION');
  const q = JSON.parse(source.question) as Question;
  const result = JSON.parse(evaluation.result as string) as Evaluation;
  // Teacher-requested practice can follow uncertain automatic work; do not use unproved error labels.
  const evidence = result.requiresReview
    ? { ...result, steps: [], requiresReview: false }
    : result;
  const selection = recommend(
    q.skillId,
    evidence,
    await masteredSkills(db, source.classroom_id, source.student_id),
  );
  const skill = skills.find((s) => s.id === selection.skillId);
  if (!skill)
    throw new HTTPException(409, { message: 'UNSUPPORTED_REMEDIATION_SKILL' });
  const seed =
    parseInt(
      createHash('sha256').update(source.id).digest('hex').slice(0, 8),
      16,
    ) >>> 1;
  let question = generateQuestion(skill.id, seed, 'intro');
  // Avoid assigning the exact same expression when remediating the same skill.
  for (
    let i = 1;
    i <= 16 && skill.id === q.skillId && question.expression === q.expression;
    i++
  )
    question = generateQuestion(skill.id, (seed + i) % 2147483648, 'intro');
  const id = randomUUID(),
    timestamp = new Date().toISOString();
  const reason = `Your teacher requested targeted practice. ${selection.reason}`;
  const snapshot = {
    algorithmVersion: MASTERY_VERSION,
    parameters: BKT_PARAMETERS,
    skills: await masteryProgress(db, source.classroom_id, source.student_id),
  };
  await db
    .prepare('INSERT INTO assignments VALUES(?,?,?,?,?,?,?)')
    .run(
      id,
      source.classroom_id,
      `Focused practice: ${skill.title}`,
      JSON.stringify(question),
      'immediate',
      null,
      timestamp,
    );
  await db
    .prepare('INSERT INTO recommendations VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(
      randomUUID(),
      source.id,
      id,
      source.student_id,
      reviewId,
      evaluation.id as string,
      skill.id,
      selection.algorithmVersion,
      reason,
      JSON.stringify(snapshot),
      teacherId,
      timestamp,
    );
  return { id, idempotent: false };
}
export async function remediationView(db: Database, submissionId: string) {
  const assigned = await db
    .prepare(
      'SELECT r.assignment_id,r.skill_id,r.reason,r.algorithm_version,a.title FROM recommendations r JOIN assignments a ON a.id=r.assignment_id WHERE r.source_submission_id=?',
    )
    .get(submissionId);
  const latest = await db
    .prepare(
      'SELECT id,decision FROM teacher_reviews WHERE submission_id=? ORDER BY rowid DESC LIMIT 1',
    )
    .get(submissionId);
  return {
    assignment: assigned ?? null,
    eligible: !assigned && latest?.decision === 'needs_practice',
    reviewId: latest?.id ?? null,
  };
}
