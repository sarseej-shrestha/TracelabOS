import { geometryErrorCandidates } from './geometry.ts';
import {
  evaluateQuantities,
  quantityInContext,
  unitQuantity,
} from '../../math-engine/src/quantities.ts';
import { ratioErrorCandidates } from './ratios.ts';
import {
  evaluate,
  equivalent,
  parse,
  normalize,
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
function scalar(expr: Expr): boolean {
  if (expr.kind === 'number') return true;
  if (expr.kind === 'negate') return scalar(expr.value);
  return (
    expr.kind === 'binary' &&
    expr.op === '/' &&
    integer(expr.left) !== undefined &&
    integer(expr.right) !== undefined
  );
}
function term(expr: Expr): boolean {
  if (expr.kind === 'variable') return true;
  if (expr.kind === 'negate') return term(expr.value);
  if (expr.kind !== 'binary' || expr.op !== '*') return false;
  const coefficient =
    expr.left.kind === 'variable' && scalar(expr.right)
      ? expr.right
      : expr.right.kind === 'variable' && scalar(expr.left)
        ? expr.left
        : undefined;
  if (!coefficient) return false;
  const value = normalize(coefficient).b;
  return !value.zero && value.n !== value.d && value.n !== -value.d;
}
function simplifiedAffine(expr: Expr): boolean {
  if (scalar(expr) || term(expr)) return true;
  if (expr.kind !== 'binary' || !['+', '-'].includes(expr.op)) return false;
  return (
    (term(expr.left) && scalar(expr.right) && !normalize(expr.right).b.zero) ||
    (scalar(expr.left) && !normalize(expr.left).b.zero && term(expr.right))
  );
}
/** Question completion is distinct from step equivalence; old evaluation records are untouched. */
export function evaluateQuestion(
  question: Question,
  lines: string[],
): Evaluation {
  if (question.answerUnit) {
    const result = evaluateQuantities(
      question.expression,
      lines,
      question.answerUnit,
    );
    const error = result.steps.find(
      (step) =>
        step.outcome === 'FIRST_ERROR' && step.ruleId === 'QUANTITY_VALUE',
    );
    if (
      error &&
      (error.line === 1 ||
        lines[error.line - 2]?.trim() === question.expression.trim())
    ) {
      const observed = quantityInContext(error.input, question.answerUnit);
      const unit = unitQuantity(
        question.answerUnit.unit,
        question.answerUnit.power,
      );
      for (const candidate of geometryErrorCandidates(question))
        if (
          observed.power === unit.power &&
          observed.value.equals(candidate.value.mul(unit.value))
        ) {
          Object.assign(error, {
            ruleId: candidate.ruleId,
            explanation: candidate.explanation,
          });
          break;
        }
    }
    for (const step of result.steps)
      if (['FIRST_ERROR', 'INDEPENDENT_ERROR'].includes(step.outcome))
        step.skillId = question.skillId;
    return result;
  }
  const result = evaluate(question.expression, lines, question.reasoningDomain);
  result.engineVersion += ':completion-2';
  const error = result.steps.find((s) => s.outcome === 'FIRST_ERROR');
  if (
    error &&
    (error.line === 1 ||
      lines[error.line - 2]?.trim() === question.expression.trim())
  ) {
    for (const candidate of ratioErrorCandidates(question)) {
      try {
        const expected = question.expression.includes('=')
          ? `x=${candidate.value}`
          : candidate.value;
        if (equivalent(parse(expected), parse(error.input)) === true) {
          const { ruleId, explanation, skillId } = candidate;
          Object.assign(error, { ruleId, explanation, skillId });
          break;
        }
      } catch {
        /* Unsupported forms retain their original review/classification. */
      }
    }
  }

  for (const step of result.steps)
    if (step.ruleId === 'EQUIVALENCE_CHANGED') step.skillId = question.skillId;
  const requirement =
    question.answerForm ??
    (question.skillId === 'fraction-equivalence'
      ? 'reduced-fraction'
      : 'value');
  if (
    requirement === 'simplified-affine' &&
    result.firstError === null &&
    !result.requiresReview
  ) {
    const last = parse(lines.at(-1)!);
    result.complete =
      last.kind === 'expression' && simplifiedAffine(last.value);
    if (!result.complete)
      result.completionHint =
        'Your expressions are equivalent. Finish by distributing and combining like terms: keep at most one x term and one nonzero constant, and remove zero terms and factors of 1.';
  }
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
