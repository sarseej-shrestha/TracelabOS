/** Exact, bounded arithmetic for the supported rational/affine domain. */
export const ENGINE_VERSION = '0.1.0';
export type Outcome =
  | 'VALID'
  | 'FIRST_ERROR'
  | 'PROPAGATED_ERROR'
  | 'INDEPENDENT_ERROR'
  | 'AMBIGUOUS'
  | 'UNSUPPORTED'
  | 'REQUIRES_REVIEW';
export class MathIssue extends Error {
  constructor(
    public readonly code: 'SYNTAX' | 'UNSUPPORTED' | 'DOMAIN' | 'LIMIT',
    message: string,
  ) {
    super(message);
  }
}
const abs = (x: bigint) => (x < 0n ? -x : x);
export class Rational {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1) {
    let a = BigInt(n),
      b = BigInt(d);
    if (!b) throw new MathIssue('DOMAIN', 'Division by zero is undefined.');
    if (abs(a).toString(2).length > 256 || abs(b).toString(2).length > 256)
      throw new MathIssue('LIMIT', 'Number exceeds the supported size.');
    if (b < 0n) {
      a = -a;
      b = -b;
    }
    let x = abs(a),
      y = b;
    while (y) {
      const r = x % y;
      x = y;
      y = r;
    }
    this.n = a / x;
    this.d = b / x;
  }
  add(r: Rational) {
    return new Rational(this.n * r.d + r.n * this.d, this.d * r.d);
  }
  sub(r: Rational) {
    return this.add(r.neg());
  }
  mul(r: Rational) {
    return new Rational(this.n * r.n, this.d * r.d);
  }
  div(r: Rational) {
    return new Rational(this.n * r.d, this.d * r.n);
  }
  neg() {
    return new Rational(-this.n, this.d);
  }
  equals(r: Rational) {
    return this.n === r.n && this.d === r.d;
  }
  get zero() {
    return this.n === 0n;
  }
  toString() {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
}
export type Expr =
  | { kind: 'number'; value: Rational }
  | { kind: 'variable'; name: 'x' }
  | { kind: 'negate'; value: Expr }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: Expr; right: Expr };
export type Statement =
  | { kind: 'expression'; value: Expr }
  | { kind: 'equation'; left: Expr; right: Expr };
type Token = { value: string; offset: number };
export function tokenize(input: string): Token[] {
  if (!input.trim())
    throw new MathIssue('SYNTAX', 'Enter a mathematical expression.');
  if (input.length > 512)
    throw new MathIssue('LIMIT', 'Use at most 512 characters per line.');
  const s = input
    .replaceAll('−', '-')
    .replaceAll('×', '*')
    .replaceAll('÷', '/');
  const tokens: Token[] = [];
  const re = /\s+|\d+(?:\.\d+)?|[x()+\-*/=]/gy;
  let offset = 0;
  while (offset < s.length) {
    re.lastIndex = offset;
    const m = re.exec(s);
    if (!m)
      throw new MathIssue(
        'UNSUPPORTED',
        `Unsupported symbol at position ${offset + 1}. Use numbers, x, parentheses and + - * / =.`,
      );
    if (m[0].trim()) tokens.push({ value: m[0], offset });
    offset = re.lastIndex;
    if (tokens.length > 256)
      throw new MathIssue('LIMIT', 'Too many tokens in one line.');
  }
  return tokens;
}
export function parse(input: string): Statement {
  const tokens = tokenize(input);
  let i = 0;
  const peek = () => tokens[i]?.value;
  const take = () => tokens[i++]!.value;
  function atom(depth: number): Expr {
    if (depth > 32)
      throw new MathIssue('LIMIT', 'Expression nesting is too deep.');
    const t = peek();
    if (t === '+' || t === '-') {
      take();
      const v = atom(depth + 1);
      return t === '-' ? { kind: 'negate', value: v } : v;
    }
    if (t === '(') {
      take();
      const v = sum(depth + 1);
      if (take() !== ')')
        throw new MathIssue('SYNTAX', 'Close each parenthesis.');
      return v;
    }
    if (t === 'x') {
      take();
      return { kind: 'variable', name: 'x' };
    }
    if (t && /^\d/.test(t)) {
      take();
      const [a, b = ''] = t.split('.');
      return {
        kind: 'number',
        value: new Rational(BigInt(a! + b), 10n ** BigInt(b.length)),
      };
    }
    throw new MathIssue(
      'SYNTAX',
      `Expected a number, x, or parenthesis near token ${i + 1}.`,
    );
  }
  function product(depth: number): Expr {
    let left = atom(depth);
    while (
      peek() === '*' ||
      peek() === '/' ||
      peek() === 'x' ||
      peek() === '('
    ) {
      const explicit = peek() === '*' || peek() === '/';
      const op = explicit ? (take() as '*' | '/') : '*';
      left = { kind: 'binary', op, left, right: atom(depth) };
    }
    return left;
  }
  function sum(depth: number): Expr {
    let left = product(depth);
    while (peek() === '+' || peek() === '-') {
      const op = take() as '+' | '-';
      left = { kind: 'binary', op, left, right: product(depth) };
    }
    return left;
  }
  // Guard EOF reads to keep malformed syntax within the public error contract.
  try {
    const left = sum(0);
    const statement: Statement =
      peek() === '='
        ? (take(), { kind: 'equation', left, right: sum(0) })
        : { kind: 'expression', value: left };
    if (i !== tokens.length)
      throw new MathIssue(
        'SYNTAX',
        'Unexpected trailing tokens; enter one expression or equation per line.',
      );
    return statement;
  } catch (e) {
    if (e instanceof MathIssue) throw e;
    throw new MathIssue(
      'SYNTAX',
      'Incomplete expression or missing parenthesis.',
    );
  }
}
export type Affine = { a: Rational; b: Rational };
const zero = () => new Rational(0);
export function normalize(e: Expr): Affine {
  if (e.kind === 'number') return { a: zero(), b: e.value };
  if (e.kind === 'variable') return { a: new Rational(1), b: zero() };
  if (e.kind === 'negate') {
    const v = normalize(e.value);
    return { a: v.a.neg(), b: v.b.neg() };
  }
  const l = normalize(e.left),
    r = normalize(e.right);
  if (e.op === '+') return { a: l.a.add(r.a), b: l.b.add(r.b) };
  if (e.op === '-') return { a: l.a.sub(r.a), b: l.b.sub(r.b) };
  if (e.op === '/') {
    // A syntactically variable denominator stays unsupported even if it simplifies.
    if (hasVariable(e.right))
      throw new MathIssue(
        'UNSUPPORTED',
        'Variable denominators require domain analysis beyond this version.',
      );
    return { a: l.a.div(r.b), b: l.b.div(r.b) };
  }
  if (!l.a.zero && !r.a.zero)
    throw new MathIssue(
      'UNSUPPORTED',
      'Nonlinear products require teacher review.',
    );
  return { a: l.a.mul(r.b).add(r.a.mul(l.b)), b: l.b.mul(r.b) };
}
function hasVariable(e: Expr): boolean {
  return (
    e.kind === 'variable' ||
    (e.kind === 'negate' && hasVariable(e.value)) ||
    (e.kind === 'binary' && (hasVariable(e.left) || hasVariable(e.right)))
  );
}
type Meaning =
  | { kind: 'affine'; value: Affine }
  | { kind: 'solution'; value: Rational }
  | { kind: 'degenerate' };
function meaning(s: Statement): Meaning {
  if (s.kind === 'expression')
    return { kind: 'affine', value: normalize(s.value) };
  const l = normalize(s.left),
    r = normalize(s.right);
  if (!hasVariable(s.left) && !hasVariable(s.right)) {
    if (!l.b.equals(r.b))
      throw new MathIssue('DOMAIN', 'The two numerical sides are not equal.');
    return { kind: 'affine', value: l };
  }
  const a = l.a.sub(r.a),
    b = l.b.sub(r.b);
  return a.zero
    ? { kind: 'degenerate' }
    : { kind: 'solution', value: b.neg().div(a) };
}
export function equivalent(left: Statement, right: Statement): boolean | null {
  const l = meaning(left),
    r = meaning(right);
  if (l.kind === 'degenerate' || r.kind === 'degenerate') return null;
  if (l.kind !== r.kind) return false;
  if (l.kind === 'solution' && r.kind === 'solution')
    return l.value.equals(r.value);
  if (l.kind === 'affine' && r.kind === 'affine')
    return l.value.a.equals(r.value.a) && l.value.b.equals(r.value.b);
  return false;
}
function misconception(
  previous: Statement,
  current: Statement,
): { ruleId: string; explanation: string; skillId: string } {
  const p = previous.kind === 'equation' ? previous.left : previous.value;
  const c = current.kind === 'equation' ? current.left : current.value;
  // Recognize the specific structural error a(b +/- c) -> ab +/- c.
  if (
    p.kind === 'binary' &&
    p.op === '*' &&
    p.right.kind === 'binary' &&
    (p.right.op === '+' || p.right.op === '-')
  ) {
    const wrong: Expr = {
      kind: 'binary',
      op: p.right.op,
      left: { kind: 'binary', op: '*', left: p.left, right: p.right.left },
      right: p.right.right,
    };
    const w = normalize(wrong),
      n = normalize(c);
    if (w.a.equals(n.a) && w.b.equals(n.b))
      return {
        ruleId: 'DISTRIBUTE_ALL_TERMS',
        explanation:
          'The multiplier must apply to every term inside the parentheses. Here it was applied only to the first term.',
        skillId: 'distributive-property',
      };
  }
  if (
    p.kind === 'binary' &&
    p.op === '+' &&
    p.left.kind === 'binary' &&
    p.left.op === '/' &&
    p.right.kind === 'binary' &&
    p.right.op === '/'
  ) {
    const a = normalize(p.left.left),
      b = normalize(p.left.right),
      d = normalize(p.right.left),
      e = normalize(p.right.right);
    if ([a, b, d, e].every((v) => v.a.zero)) {
      const denominator = b.b.add(e.b);
      const observed = normalize(c);
      if (
        !denominator.zero &&
        observed.a.zero &&
        observed.b.equals(a.b.add(d.b).div(denominator))
      )
        return {
          ruleId: 'ADD_DENOMINATORS',
          explanation:
            'Use equivalent fractions with a common denominator, then add the numerators. Adding the denominators changes the size of the parts.',
          skillId: 'fraction-addition',
        };
    }
  }
  return {
    ruleId: 'EQUIVALENCE_CHANGED',
    explanation:
      'This step changes the value or solution set. Check the arithmetic and apply the same reversible operation to both sides.',
    skillId: 'one-step-equations',
  };
}
export interface StepEvaluation {
  line: number;
  input: string;
  outcome: Outcome;
  explanation: string;
  ruleId: string;
  dependsOn?: number;
  skillId?: string;
}
export interface Evaluation {
  engineVersion: string;
  steps: StepEvaluation[];
  firstError: number | null;
  complete: boolean;
  requiresReview: boolean;
}
export function evaluate(problem: string, lines: string[]): Evaluation {
  if (!lines.length || lines.length > 40)
    throw new MathIssue('LIMIT', 'Submit between 1 and 40 lines.');
  const anchor = parse(problem);
  meaning(anchor);
  let previous = anchor,
    firstError: number | null = null,
    unknown = false;
  const steps: StepEvaluation[] = [];
  for (const [index, input] of lines.entries()) {
    const line = index + 1;
    let current: Statement | undefined;
    try {
      current = parse(input);
      let valid: boolean | null;
      try {
        valid = equivalent(previous, current);
      } catch (e) {
        if (
          e instanceof MathIssue &&
          e.code === 'DOMAIN' &&
          e.message.includes('two numerical sides')
        )
          valid = false;
        else throw e;
      }
      if (valid === null) {
        unknown = true;
        steps.push({
          line,
          input,
          outcome: 'AMBIGUOUS',
          ruleId: 'DEGENERATE_EQUATION',
          explanation:
            'An identity or inconsistent equation needs a rule-level review; matching solution sets is insufficient.',
        });
      } else if (unknown)
        steps.push({
          line,
          input,
          outcome: 'REQUIRES_REVIEW',
          ruleId: 'UNVERIFIED_PREDECESSOR',
          explanation:
            'An earlier step could not be verified. Review the chain before assigning a grade.',
        });
      else if (valid) {
        const propagated =
          firstError !== null && equivalent(anchor, current) !== true;
        steps.push({
          line,
          input,
          outcome: propagated ? 'PROPAGATED_ERROR' : 'VALID',
          ruleId: propagated
            ? 'CONSISTENT_WITH_PRIOR_ERROR'
            : 'EXACT_EQUIVALENCE',
          ...(propagated ? { dependsOn: firstError! } : {}),
          explanation: propagated
            ? 'This step is consistent with the previous step, but carries forward its earlier error.'
            : 'The value or linear solution is preserved in the supported domain. This does not prove an unshown operation.',
        });
      } else {
        const info = misconception(previous, current);
        steps.push({
          line,
          input,
          outcome: firstError === null ? 'FIRST_ERROR' : 'INDEPENDENT_ERROR',
          ...info,
        });
        firstError ??= line;
      }
      // False numerical equations cannot be used as a valid baseline.
      try {
        meaning(current);
        previous = current;
      } catch {
        unknown = true;
      }
    } catch (e) {
      if (!(e instanceof MathIssue)) throw e;
      unknown = true;
      steps.push({
        line,
        input,
        outcome: e.code === 'UNSUPPORTED' ? 'UNSUPPORTED' : 'REQUIRES_REVIEW',
        explanation: e.message,
        ruleId: e.code,
      });
    }
  }
  const last = lines.at(-1)!;
  let terminal = false;
  try {
    const s = parse(last);
    terminal =
      s.kind === 'equation'
        ? (s.left.kind === 'variable' && !hasVariable(s.right)) ||
          (s.right.kind === 'variable' && !hasVariable(s.left))
        : !hasVariable(s.value) &&
          (s.value.kind === 'number' ||
            (s.value.kind === 'binary' &&
              s.value.op === '/' &&
              s.value.left.kind === 'number' &&
              s.value.right.kind === 'number'));
    // A final numerical equality also completes an arithmetic problem.
    if (s.kind === 'equation' && !hasVariable(s.left) && !hasVariable(s.right))
      terminal = true;
  } catch {
    /* The line already carries its review status. */
  }
  return {
    engineVersion: ENGINE_VERSION,
    steps,
    firstError,
    complete: terminal && firstError === null && !unknown,
    requiresReview: unknown,
  };
}
