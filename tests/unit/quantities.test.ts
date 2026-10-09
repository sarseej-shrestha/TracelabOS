import { expect, it, describe } from 'vitest';
import fc from 'fast-check';
import { Rational } from '../../packages/math-engine/src/index.ts';
import {
  evaluateQuantities,
  parseQuantity,
  unitQuantity,
} from '../../packages/math-engine/src/quantities.ts';
const area = { unit: 'cm', power: 2 } as const;
const length = { unit: 'cm', power: 1 } as const;
describe('exact dimensional parser', () => {
  it.each([
    ['8 cm * 3 cm', '3/1250', 2],
    ['24 cm²', '3/1250', 2],
    ['2400 mm2', '3/1250', 2],
    ['0.0024 m^2', '3/1250', 2],
    ['(8+3)*2 cm', '11/50', 1],
    ['2*(8 cm+3 cm)', '11/50', 1],
    ['24 cm2 / (3 cm)', '2/25', 1],
    ['1 m + 20 cm', '6/5', 1],
    ['1 m2 - 20 cm2', '499/500', 2],
    ['3/2 cm²', '3/20000', 2],
    ['(3/2)cm^2', '3/20000', 2],
    ['-2 cm * -3 cm', '3/5000', 2],
    ['2cm*3cm/2', '3/10000', 2],
    ['3 cm ÷ 2 cm', '3/2', 0],
    ['3cm × 2cm', '3/5000', 2],
    ['3cm³', '3/1000000', 3],
    ['24cm²=2400mm²', '3/1250', 2],
  ])('parses %s', (text, value, power) => {
    const q = parseQuantity(text);
    expect(q.value.toString()).toBe(value);
    expect(q.power).toBe(power);
    expect(q.annotated).toBe(true);
  });
  it.each([
    '2cm+3cm²',
    '1cm=1m',
    '2/0 cm',
    '2 cm/(1-1)',
    'x cm',
    '24 kg',
    '1 km',
    '2^3 cm',
    '2cm^4',
    '2 3 cm',
    '2..3 cm',
    '2cm trailing',
    '2cm=',
    '(2cm',
    '2cm)',
    '2cm=2cm=2cm',
    'process.exit()',
  ])('rejects undefined, unsupported or malformed %s', (input) =>
    expect(() => parseQuantity(input)).toThrow(),
  );
  it('retains explicit unit provenance on either side of an equality', () =>
    expect(parseQuantity('1=1cm/1cm')).toMatchObject({
      power: 0,
      annotated: true,
    }));
  it('bounds input, tokens and nesting', () => {
    for (const input of [
      '1'.repeat(513),
      '1+'.repeat(150) + '1',
      '('.repeat(33) + '1' + ')'.repeat(33),
      '9999999999999999999999999999999999999999999999999999999999999999999999999999999999999cm',
    ])
      expect(() => parseQuantity(input)).toThrow();
  });
  it.each([0, 4, NaN, Infinity, -1])(
    'rejects unsupported unit exponent %s',
    (power) => expect(() => unitQuantity('cm', power)).toThrow(),
  );
});
describe('quantity reasoning and completion', () => {
  it.each(['24 cm²', '2400 mm²', '0.0024 m²', '8cm*3cm=24cm²'])(
    'accepts equivalent final units %s',
    (final) =>
      expect(evaluateQuantities('8*3', ['8*3', final], area)).toMatchObject({
        complete: true,
        requiresReview: false,
        firstError: null,
      }),
  );
  it('accepts a fractional final quantity', () =>
    expect(evaluateQuantities('3/2', ['(3/2)cm²'], area).complete).toBe(true));
  it.each(['24', '8*3', '8cm*3cm', '(8+4)*2 cm²'])(
    'keeps unannotated or unfinished %s valid but incomplete',
    (input) =>
      expect(evaluateQuantities('8*3', [input], area)).toMatchObject({
        complete: false,
        firstError: null,
        requiresReview: false,
        completionHint: expect.any(String),
      }),
  );
  it('distinguishes area from perimeter units and carries the mistake forward', () => {
    const lines = ['24 cm', '240 mm'];
    const r = evaluateQuantities('8*3', lines, area);
    expect(r.steps.map((s) => s.outcome)).toEqual([
      'FIRST_ERROR',
      'PROPAGATED_ERROR',
    ]);
    expect(r.steps[0]!.ruleId).toBe('UNIT_DIMENSION');
    expect(r.steps[1]!.dependsOn).toBe(1);
    expect(r.steps.map((s) => s.input)).toEqual(lines);
  });
  it('reports an independent arithmetic error after a unit mistake', () =>
    expect(
      evaluateQuantities('8*3', ['24cm', '250mm'], area).steps.map(
        (s) => s.outcome,
      ),
    ).toEqual(['FIRST_ERROR', 'INDEPENDENT_ERROR']));
  it('does not confuse matching dimensions with matching physical quantity', () =>
    expect(evaluateQuantities('8*3', ['24m²'], area).steps[0]).toMatchObject({
      outcome: 'FIRST_ERROR',
      ruleId: 'QUANTITY_VALUE',
    }));
  it('checks perimeter as a length', () => {
    expect(evaluateQuantities('2*(8+3)', ['22cm'], length).complete).toBe(true);
    expect(
      evaluateQuantities('2*(8+3)', ['22cm²'], length).steps[0]!.ruleId,
    ).toBe('UNIT_DIMENSION');
  });
  it('does not discard units that cancel within an expression', () =>
    expect(
      evaluateQuantities('1', ['1=1cm/1cm'], length).steps[0]!.ruleId,
    ).toBe('UNIT_DIMENSION'));
  it('keeps an unknown predecessor ungraded even after a correct answer', () =>
    expect(
      evaluateQuantities('8*3', ['2cm+3cm²', '24cm²'], area),
    ).toMatchObject({
      complete: false,
      requiresReview: true,
      steps: [{ outcome: 'REQUIRES_REVIEW' }, { outcome: 'REQUIRES_REVIEW' }],
    }));
  it('rejects empty/oversized submissions and invalid question dimensions', () => {
    expect(() => evaluateQuantities('8*3', [], area)).toThrow();
    expect(() =>
      evaluateQuantities('8*3', Array(41).fill('24cm²'), area),
    ).toThrow();
    expect(() => evaluateQuantities('8cm', ['8cm²'], area)).toThrow();
  });
  it('preserves 1,000 seeded metric area conversions and wrong-dimension counterexamples', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (a, b) => {
          const cm2 = a * b;
          const parsed = parseQuantity(`${a}cm*${b}cm`);
          expect(parsed.value.equals(new Rational(cm2, 10000))).toBe(true);
          expect(
            evaluateQuantities(`${a}*${b}`, [`${cm2 * 100}mm²`], area).complete,
          ).toBe(true);
          expect(
            evaluateQuantities(`${a}*${b}`, [`${cm2}cm`], area).firstError,
          ).toBe(1);
        },
      ),
      { numRuns: 1000, seed: 20261010 },
    ));
});
