import type { AnswerUnit } from '../../math-engine/src/quantities.ts';
export type Difficulty = 'intro' | 'practice' | 'challenge';
export interface Skill {
  id: string;
  unit: string;
  title: string;
  prerequisites: readonly string[];
  description: string;
  examples: readonly (readonly string[])[];
  standards?: readonly string[];
  misconceptions?: readonly string[];
  remediationSkillId?: string;
}
export interface FractionFigure {
  kind: 'fraction-bars';
  caption: string;
  fractions: { numerator: number; denominator: number; label: string }[];
}
export interface AlgebraFigure {
  kind: 'algebra-structure';
  parts: string[];
  caption: string;
}
export interface RatioFigure {
  kind: 'ratio-table' | 'double-number-line';
  labels: [string, string];
  rows: [string, string][];
  caption: string;
  positions?: number[];
}
export interface GeometryFigure {
  kind: 'geometry';
  points: [number, number][];
  labels: { x: number; y: number; text: string }[];
  guides?: { from: [number, number]; to: [number, number] }[];
  caption: string;
}
export type QuestionFigure =
  FractionFigure | AlgebraFigure | RatioFigure | GeometryFigure;
export interface Question {
  id: string;
  templateId: string;
  templateVersion: string;
  skillId: string;
  seed: number;
  difficulty: Difficulty;
  prompt: string;
  expression: string;
  reference: string[];
  parameters: Record<string, number>;
  alternativePaths?: string[][];
  explanation?: string;
  figure?: QuestionFigure;
  answerUnit?: AnswerUnit;
  reasoningDomain?: 'positive-proportion';
  answerForm?: 'value' | 'reduced-fraction' | 'simplified-affine';
}
