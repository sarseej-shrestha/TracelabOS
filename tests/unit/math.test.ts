import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  Rational,
  parse,
  normalize,
  equivalent,
  evaluate,
  MathIssue,
  tokenize,
} from '../../packages/math-engine/src/index.ts';
import {
  generateQuestion,
  skills,
} from '../../packages/question-bank/src/index.ts';
describe('exact arithmetic', () => {
  it.each([
    [2, 4, '1/2'],
    [-2, 4, '-1/2'],
    [2, -4, '-1/2'],
    [-2, -4, '1/2'],
    [0, 5, '0'],
    [15, 5, '3'],
  ])('normalizes %s/%s', (a, b, want) =>
    expect(new Rational(a as number, b as number).toString()).toBe(want),
  );
  it('rejects zero denominators', () =>
    expect(() => new Rational(1, 0)).toThrow('zero'));
  it('bounds integer size', () =>
    expect(() => new Rational(2n ** 257n)).toThrow('size'));
  it('preserves rational round trips for 2,000 cases', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: -100000, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 1000 }),
        (a, b, k) => {
          const r = new Rational(a, b);
          expect(r.mul(new Rational(k)).div(new Rational(k)).equals(r)).toBe(
            true,
          );
        },
      ),
      { numRuns: 2000, seed: 42 },
    ));
});
describe('parser', () => {
  it.each([
    '2+3*4',
    '(2+3)*4',
    '-3 + 4',
    '3(x-2)',
    '0.1+0.2',
    '1/(2+3)',
    'x/3',
    '2x+1',
    '−2×3',
    '1÷2',
    '--2',
  ])('parses %s', (s) => expect(parse(s)).toBeDefined());
  it('uses operator precedence', () => {
    const p = parse('2+3*4');
    if (p.kind === 'expression')
      expect(normalize(p.value).b.toString()).toBe('14');
  });
  it('uses exact decimals', () =>
    expect(equivalent(parse('0.1+0.2'), parse('0.3'))).toBe(true));
  it.each(['', '(', '1+', '1//2', 'x==2', '1 2', '3)', '()', '2=', 'x=1=2'])(
    'rejects malformed %s',
    (s) => expect(() => parse(s)).toThrow(MathIssue),
  );
  it.each([
    'x^2',
    'sqrt(2)',
    'y+1',
    '<script>',
    'Infinity',
    'NaN',
    'x<2',
    '\\frac{1}{2}',
  ])('identifies unsupported %s', (s) =>
    expect(() => parse(s)).toThrow(MathIssue),
  );
  it('limits input length', () =>
    expect(() => tokenize('1'.repeat(513))).toThrow('512'));
  it('limits nesting', () =>
    expect(() => parse('('.repeat(34) + '1' + ')'.repeat(34))).toThrow('deep'));
});
describe('reasoning provenance', () => {
  it('detects distribution and dependent steps', () => {
    const r = evaluate('3(x-2)=15', [
      '3(x-2)=15',
      '3x-2=15',
      '3x=17',
      'x=17/3',
    ]);
    expect(r.steps.map((s) => s.outcome)).toEqual([
      'VALID',
      'FIRST_ERROR',
      'PROPAGATED_ERROR',
      'PROPAGATED_ERROR',
    ]);
    expect(r.steps[1]?.ruleId).toBe('DISTRIBUTE_ALL_TERMS');
    expect(r.steps[3]?.dependsOn).toBe(2);
    expect(r.complete).toBe(false);
  });
  it('accepts correct alternatives', () =>
    expect(evaluate('3(x-2)=15', ['x-2=5', 'x=7']).complete).toBe(true));
  it('detects an independent error', () =>
    expect(evaluate('3(x-2)=15', ['3x-2=15', 'x=4']).steps[1]?.outcome).toBe(
      'INDEPENDENT_ERROR',
    ));
  it('does not call a restated problem complete', () =>
    expect(evaluate('3(x-2)=15', ['3(x-2)=15']).complete).toBe(false));
  it('classifies denominator addition', () =>
    expect(evaluate('1/2+1/3', ['2/5']).steps[0]?.ruleId).toBe(
      'ADD_DENOMINATORS',
    ));
  it('accepts fraction calculations', () =>
    expect(evaluate('1/2+1/3', ['3/6+2/6', '5/6']).complete).toBe(true));
  it('rejects a false numerical equality', () =>
    expect(evaluate('1/2+1/3', ['1/2+1/3=2/5']).steps[0]?.outcome).toBe(
      'FIRST_ERROR',
    ));
  it('does not bridge an unsupported predecessor', () => {
    const r = evaluate('x=2', ['x^2=4', 'x=2']);
    expect(r.steps.map((s) => s.outcome)).toEqual([
      'UNSUPPORTED',
      'REQUIRES_REVIEW',
    ]);
    expect(r.complete).toBe(false);
  });
  it.each(['x/x=1', '1/(x-x+1)=1', 'x*x=4', 'x/0=2', '1/0', '0x=0', '0x=1'])(
    'refuses unsafe or degenerate reasoning %s',
    (s) => {
      const r = evaluate('x=2', [s]);
      expect(r.requiresReview).toBe(true);
      expect(r.firstError).toBeNull();
    },
  );
  it('does not certify division that loses solutions', () =>
    expect(evaluate('0x=0', ['x=1']).steps[0]?.outcome).toBe('AMBIGUOUS'));
  it('rejects empty and excessive solution lists', () => {
    expect(() => evaluate('x=1', [])).toThrow();
    expect(() => evaluate('x=1', Array(41).fill('x=1'))).toThrow();
  });
  it('preserves linear solutions across 2,000 generated transformations', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        (a, b, x) => {
          expect(
            evaluate(`${a}*(x+(${b}))=${a * (x + b)}`, [
              `${a}*x=${a * x}`,
              `x=${x}`,
            ]).complete,
          ).toBe(true);
        },
      ),
      { numRuns: 2000, seed: 20261008 },
    ));
  it('finds deliberately perturbed solutions across 1,000 cases', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: -100, max: 100 }),
        (a, x) => {
          expect(evaluate(`${a}x=${a * x}`, [`x=${x + 1}`]).firstError).toBe(1);
        },
      ),
      { numRuns: 1000, seed: 123 },
    ));
});
describe('question templates', () => {
  for (const skill of skills)
    for (const difficulty of ['intro', 'practice', 'challenge'] as const)
      for (const seed of [
        0, 1, 2, 3, 4, 5, 13, 42, 99, 1024, 9999, 2147483647,
      ]) {
        it(`${skill.id}/${difficulty}/${seed} has a verified reference`, () => {
          const q = generateQuestion(skill.id, seed, difficulty);
          expect(evaluate(q.expression, q.reference).complete).toBe(true);
          expect(generateQuestion(skill.id, seed, difficulty)).toEqual(q);
          expect(q.parameters).toBeDefined();
        });
      }
  it('rejects unknown skills', () =>
    expect(() => generateQuestion('unknown', 1)).toThrow());
  it.each([-1, 0.5, NaN, Infinity, 2147483648])('rejects seed %s', (seed) =>
    expect(() => generateQuestion('fraction-addition', seed)).toThrow(),
  );
});

describe('misconception specificity regressions', () => {
  it('does not label an introduced variable as denominator addition', () =>
    expect(evaluate('1/2+1/3', ['x+2/5']).steps[0]?.ruleId).toBe(
      'EQUIVALENCE_CHANGED',
    ));
  it('does not let a zero candidate denominator hide a provable error', () => {
    const r = evaluate('1/2+1/(-2)', ['3']);
    expect(r.steps[0]?.outcome).toBe('FIRST_ERROR');
    expect(r.requiresReview).toBe(false);
  });
});
