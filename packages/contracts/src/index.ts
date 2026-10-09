import { z } from 'zod';
export const states = [
  'CREATED',
  'UPLOADED',
  'PROCESSING',
  'CONFIRMATION_REQUIRED',
  'EXTRACTION_FAILED',
  'MANUAL_ENTRY',
  'CONFIRMED',
  'EVALUATED',
  'TEACHER_REVIEW',
  'FINALIZED',
] as const;
export type SubmissionState = (typeof states)[number];
export const transitions: Record<SubmissionState, readonly SubmissionState[]> =
  {
    CREATED: ['UPLOADED', 'MANUAL_ENTRY'],
    UPLOADED: ['PROCESSING', 'MANUAL_ENTRY'],
    PROCESSING: ['CONFIRMATION_REQUIRED', 'EXTRACTION_FAILED', 'MANUAL_ENTRY'],
    CONFIRMATION_REQUIRED: ['CONFIRMED', 'MANUAL_ENTRY'],
    EXTRACTION_FAILED: ['PROCESSING', 'MANUAL_ENTRY'],
    MANUAL_ENTRY: ['CONFIRMED', 'PROCESSING'],
    CONFIRMED: ['EVALUATED', 'TEACHER_REVIEW'],
    EVALUATED: ['TEACHER_REVIEW', 'FINALIZED'],
    TEACHER_REVIEW: ['FINALIZED'],
    FINALIZED: [],
  };
export function transition(
  from: SubmissionState,
  to: SubmissionState,
): SubmissionState {
  if (!transitions[from].includes(to))
    throw new Error(`INVALID_TRANSITION: ${from} -> ${to}`);
  return to;
}
export const linesSchema = z
  .array(z.string().trim().min(1).max(512))
  .min(1)
  .max(40);
export const transcriptionSchema = z
  .object({ lines: linesSchema, version: z.number().int().positive() })
  .strict();
export const confirmSchema = z
  .object({ version: z.number().int().positive(), confirmed: z.literal(true) })
  .strict();
export const roleSchema = z.enum(['teacher', 'student']);
export const classroomSchema = z
  .object({ name: z.string().trim().min(2).max(80) })
  .strict();
export const enrollmentSchema = z
  .object({ code: z.string().regex(/^[A-F0-9]{12}$/) })
  .strict();
export const assignmentSchema = z
  .object({
    classroomId: z.string().uuid(),
    skillId: z.string().max(60),
    seed: z.number().int().min(0).max(2147483647),
    difficulty: z.enum(['intro', 'practice', 'challenge']),
    title: z.string().trim().min(2).max(120),
    feedback: z.enum(['immediate', 'teacher']),
    dueAt: z.iso.datetime().nullable().default(null),
  })
  .strict();
export const reviewSchema = z
  .object({
    decision: z.enum(['correct', 'needs_practice', 'requires_review']),
    reason: z.string().trim().min(5).max(1000),
  })
  .strict();
export const ocrSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    modelVersion: z.string().min(1).max(100),
    status: z.literal('needs_confirmation'),
    lines: z
      .array(
        z
          .object({
            line: z.number().int().positive(),
            raw: z.string().max(512),
            latex: z.string().max(512),
            bbox: z
              .tuple([z.number(), z.number(), z.number(), z.number()])
              .refine(
                (b) =>
                  b.every((n) => n >= 0 && n <= 1) &&
                  b[0] < b[2] &&
                  b[1] < b[3],
                'Invalid normalized bounding box',
              )
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(40),
  })
  .strict()
  .refine(
    (v) => v.lines.every((l, i) => l.line === i + 1),
    'Lines must be sequential and unique',
  );
export type OcrResult = z.infer<typeof ocrSchema>;
