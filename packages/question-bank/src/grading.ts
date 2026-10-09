import {
  evaluate,
  parse,
  Rational,
  type Expr,
  type Evaluation,
} from '../../math-engine/src/index.ts';
import type { Question } from './types.ts';
function integer(expr: Expr): bigint | undefined {
  if (expr.kind === 'number' && expr.value.d === 1n) return expr.value.n;
  if (expr.kind === 'negate') {
    const n = integer(expr.value);
    return n === undefined ? undefined : -n;
  }
}
function reduced(expr: Expr): boolean {
  if (integer(expr) !== undefined) return true;
  if (expr.kind === 'negate') return reduced(expr.value);
  if (expr.kind !== 'binary' || expr.op !== '/') return false;
  const n = integer(expr.left),
    d = integer(expr.right);
  if (n === undefined || d === undefined || d <= 0n) return false;
  const normalized = new Rational(n, d);
  return normalized.n === n && normalized.d === d;
}
/** Question completion is distinct from step equivalence; old evaluation records are untouched. */
export function evaluateQuestion(
  question: Question,
  lines: string[],
): Evaluation {
  const result = evaluate(question.expression, lines);
  result.engineVersion += ':completion-1';
  for (const step of result.steps)
    if (step.ruleId === 'EQUIVALENCE_CHANGED') step.skillId = question.skillId;
  const requirement =
    question.answerForm ??
    (question.skillId === 'fraction-equivalence'
      ? 'reduced-fraction'
      : 'value');
  if (requirement === 'reduced-fraction' && result.complete) {
    const last = parse(lines.at(-1)!);
    if (
      !(last.kind === 'expression'
        ? reduced(last.value)
        : reduced(last.left) || reduced(last.right))
    ) {
      result.complete = false;
      result.completionHint =
        'The value is preserved. Finish with a fraction in lowest terms (or an integer); numerator and denominator must have no common factor greater than one.';
    }
  }
  return result;
}
