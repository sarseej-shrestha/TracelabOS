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
  figure?: FractionFigure;
  answerForm?: 'value' | 'reduced-fraction';
}
