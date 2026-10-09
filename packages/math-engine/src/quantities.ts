import {
  ENGINE_VERSION,
  MathIssue,
  Rational,
  type Evaluation,
  type StepEvaluation,
} from './index.ts';
export type LengthUnit = 'mm' | 'cm' | 'm';
export interface AnswerUnit {
  unit: LengthUnit;
  power: 1 | 2;
}
export interface Quantity {
  value: Rational;
  power: number;
  annotated: boolean;
}
const equal = (a: Quantity, b: Quantity) =>
  a.power === b.power && a.value.equals(b.value);
export function unitQuantity(unit: LengthUnit, power: number): Quantity {
  if (!['mm', 'cm', 'm'].includes(unit) || ![1, 2, 3].includes(power))
    throw new MathIssue(
      'UNSUPPORTED',
      'Unsupported metric unit or dimensional power.',
    );
  const denominator = unit === 'mm' ? 1000 : unit === 'cm' ? 100 : 1;
  return {
    value: new Rational(1, denominator ** power),
    power,
    annotated: true,
  };
}
/** Bounded numerical quantities; no variable names, executable expressions or inferred diagrams. */
export function parseQuantity(input: string): Quantity {
  if (!input.trim() || input.length > 512)
    throw new MathIssue('LIMIT', 'Use between 1 and 512 characters per line.');
  const source = input
    .replaceAll('−', '-')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3');
  const tokens: string[] = [];
  const regex =
    /\s+|\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?(?=\s*(?:mm|cm|m))|\d+(?:\.\d+)?|(?:mm|cm|m)(?:\^[123]|[123])?|[()+\-*/=]/gy;
  let position = 0;
  while (position < source.length) {
    regex.lastIndex = position;
    const match = regex.exec(source);
    if (!match)
      throw new MathIssue(
        'UNSUPPORTED',
        'Use numbers, arithmetic and metric units mm, cm or m, optionally squared. Other units, variables and formulas need review.',
      );
    position = regex.lastIndex;
    if (match[0].trim()) tokens.push(match[0]);
    if (tokens.length > 256)
      throw new MathIssue('LIMIT', 'Too many tokens in one quantity.');
  }
  let i = 0;
  const peek = () => tokens[i];
  const unit = (t: string | undefined) =>
    !!t && /^(mm|cm|m)(?:\^[123]|[123])?$/.test(t);
  const apply = (a: Quantity, b: Quantity, op: string): Quantity => {
    if ((op === '+' || op === '-') && a.power !== b.power)
      throw new MathIssue(
        'DOMAIN',
        'Addition and subtraction require quantities with the same dimension.',
      );
    const power =
      op === '*' ? a.power + b.power : op === '/' ? a.power - b.power : a.power;
    if (Math.abs(power) > 8)
      throw new MathIssue(
        'LIMIT',
        'This dimensional power exceeds the supported range.',
      );
    return {
      value:
        op === '+'
          ? a.value.add(b.value)
          : op === '-'
            ? a.value.sub(b.value)
            : op === '*'
              ? a.value.mul(b.value)
              : a.value.div(b.value),
      power,
      annotated: a.annotated || b.annotated,
    };
  };
  function atom(depth: number): Quantity {
    if (depth > 32)
      throw new MathIssue('LIMIT', 'Quantity nesting is too deep.');
    const t = tokens[i++];
    if (t === '+' || t === '-') {
      const q = atom(depth + 1);
      return { ...q, value: t === '-' ? q.value.neg() : q.value };
    }
    if (t === '(') {
      const q = sum(depth + 1);
      if (tokens[i++] !== ')')
        throw new MathIssue('SYNTAX', 'Close each quantity parenthesis.');
      return q;
    }
    if (unit(t)) {
      const match = /^(mm|cm|m)(?:\^?([123]))?$/.exec(t!)!;
      return unitQuantity(match[1] as LengthUnit, Number(match[2] ?? 1));
    }
    if (t && /^\d/.test(t)) {
      const decimal = (value: string) => {
        const [whole, fraction = ''] = value.trim().split('.');
        return new Rational(
          BigInt(whole! + fraction),
          10n ** BigInt(fraction.length),
        );
      };
      const [numerator, denominator] = t.split('/');
      let q: Quantity = {
        value: denominator
          ? decimal(numerator!).div(decimal(denominator))
          : decimal(t),
        power: 0,
        annotated: false,
      };
      // A measured literal binds as one operand: 3cm / 2cm is dimensionless.
      if (unit(peek())) q = apply(q, atom(depth), '*');
      return q;
    }
    throw new MathIssue(
      'SYNTAX',
      'Expected a number, metric unit or parenthesis.',
    );
  }
  function product(depth: number): Quantity {
    let q = atom(depth);
    while (peek() === '*' || peek() === '/' || peek() === '(' || unit(peek())) {
      const op = peek() === '*' || peek() === '/' ? tokens[i++]! : '*';
      q = apply(q, atom(depth), op);
    }
    return q;
  }
  function sum(depth: number): Quantity {
    let q = product(depth);
    while (peek() === '+' || peek() === '-') {
      const op = tokens[i++]!;
      q = apply(q, product(depth), op);
    }
    return q;
  }
  let left = sum(0);
  if (peek() === '=') {
    i++;
    const right = sum(0);
    if (!equal(left, right))
      throw new MathIssue(
        'DOMAIN',
        'The two quantities in this equality differ in value or dimension.',
      );
    left = { ...left, annotated: left.annotated || right.annotated };
  }
  if (i !== tokens.length)
    throw new MathIssue('SYNTAX', 'Unexpected quantity tokens.');
  return left;
}
export function quantityInContext(
  input: string,
  expected: AnswerUnit,
): Quantity {
  const parsed = parseQuantity(input);
  if (parsed.annotated) return parsed;
  const unit = unitQuantity(expected.unit, expected.power);
  return {
    value: parsed.value.mul(unit.value),
    power: expected.power,
    annotated: false,
  };
}
const terminal = (input: string) =>
  /^\(?[+-]?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\)?\s*(mm|cm|m)(?:\^?[12]|²)?$/.test(
    input.split('=').at(-1)!.trim(),
  );
/** Numeric intermediate lines inherit requested units; explicit units are never stripped. */
export function evaluateQuantities(
  problem: string,
  lines: string[],
  expected: AnswerUnit,
): Evaluation {
  if (!lines.length || lines.length > 40)
    throw new MathIssue('LIMIT', 'Submit between 1 and 40 lines.');
  const anchor = quantityInContext(problem, expected);
  if (anchor.power !== expected.power)
    throw new MathIssue(
      'DOMAIN',
      'The generated question has incompatible answer dimensions.',
    );
  let previous = anchor,
    firstError: number | null = null,
    unknown = false;
  const steps: StepEvaluation[] = [];
  for (const [index, input] of lines.entries()) {
    const line = index + 1;
    try {
      const current = quantityInContext(input, expected);
      if (unknown)
        steps.push({
          line,
          input,
          outcome: 'REQUIRES_REVIEW',
          ruleId: 'UNVERIFIED_PREDECESSOR',
          explanation:
            'An earlier quantity could not be verified. Review the chain before grading.',
        });
      else if (equal(previous, current)) {
        const propagated = firstError !== null && !equal(anchor, current);
        steps.push({
          line,
          input,
          outcome: propagated ? 'PROPAGATED_ERROR' : 'VALID',
          ruleId: propagated
            ? 'CONSISTENT_WITH_PRIOR_ERROR'
            : 'QUANTITY_EQUIVALENCE',
          ...(propagated ? { dependsOn: firstError! } : {}),
          explanation: propagated
            ? 'This quantity carries forward the earlier value or unit error.'
            : current.annotated
              ? 'The value and dimension are preserved after exact metric-unit conversion.'
              : `This numerical step is interpreted in the requested ${expected.unit}${expected.power === 2 ? '²' : ''}. Include units on the final answer.`,
        });
      } else {
        const dimension = current.power !== previous.power;
        steps.push({
          line,
          input,
          outcome: firstError === null ? 'FIRST_ERROR' : 'INDEPENDENT_ERROR',
          ruleId: dimension ? 'UNIT_DIMENSION' : 'QUANTITY_VALUE',
          explanation: dimension
            ? 'This step changes the dimension. Perimeter is a length; area uses square units.'
            : 'This step changes the quantity. Check arithmetic and the scale factor between metric units.',
        });
        firstError ??= line;
      }
      previous = current;
    } catch (error) {
      if (!(error instanceof MathIssue)) throw error;
      unknown = true;
      steps.push({
        line,
        input,
        outcome:
          error.code === 'UNSUPPORTED' ? 'UNSUPPORTED' : 'REQUIRES_REVIEW',
        ruleId: error.code,
        explanation: error.message,
      });
    }
  }
  const complete = firstError === null && !unknown && terminal(lines.at(-1)!);
  return {
    engineVersion: `${ENGINE_VERSION}:quantity-1`,
    steps,
    firstError,
    requiresReview: unknown,
    complete,
    ...(!complete && firstError === null && !unknown
      ? {
          completionHint: `Finish with one number or fraction and a compatible unit, such as ${expected.unit}${expected.power === 2 ? '²' : ''}.`,
        }
      : {}),
    domainConditions: [
      `Unannotated numerical steps use ${expected.unit}${expected.power === 2 ? '²' : ''}; explicit units are checked dimensionally.`,
    ],
  };
}
