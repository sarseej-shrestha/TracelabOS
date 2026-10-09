import { expect, it } from 'vitest';
import {
  states,
  transitions,
  transition,
  ocrSchema,
} from '../../packages/contracts/src/index.ts';
import { extract } from '../../packages/vision-adapter/src/index.ts';
for (const from of states)
  for (const to of states)
    it(`${from} -> ${to}`, () => {
      if (transitions[from].includes(to)) expect(transition(from, to)).toBe(to);
      else expect(() => transition(from, to)).toThrow('INVALID_TRANSITION');
    });
const valid = {
  questionId: 'q',
  modelVersion: 'test',
  status: 'needs_confirmation',
  lines: [{ line: 1, raw: 'x=2', latex: 'x=2' }],
};
it('allows absent locations without fabricating boxes', () =>
  expect(ocrSchema.parse(valid).lines[0]?.bbox).toBeUndefined());
it('rejects uncalibrated confidence', () =>
  expect(ocrSchema.safeParse({ ...valid, confidence: 0.99 }).success).toBe(
    false,
  ));
it('rejects reversed bounding boxes', () =>
  expect(
    ocrSchema.safeParse({
      ...valid,
      lines: [{ ...valid.lines[0], bbox: [0.8, 0.2, 0.1, 0.9] }],
    }).success,
  ).toBe(false));
it('rejects missing line order', () =>
  expect(
    ocrSchema.safeParse({ ...valid, lines: [{ ...valid.lines[0], line: 2 }] })
      .success,
  ).toBe(false));
it('falls back when no provider exists', async () =>
  expect(await extract(undefined, new Uint8Array(), 'q')).toEqual({
    ok: false,
    code: 'UNAVAILABLE',
    manualEntry: true,
  }));
it('handles provider failure', async () =>
  expect(
    (
      await extract(
        {
          version: 'test',
          transcribe: async () => {
            throw Error();
          },
        },
        new Uint8Array(),
        'q',
      )
    ).ok,
  ).toBe(false));
it('validates real adapter output', async () =>
  expect(
    (
      await extract(
        { version: 'test', transcribe: async () => valid },
        new Uint8Array(),
        'q',
      )
    ).ok,
  ).toBe(true));
it('rejects question substitution', async () =>
  expect(
    (
      await extract(
        { version: 'test', transcribe: async () => valid },
        new Uint8Array(),
        'other',
      )
    ).ok,
  ).toBe(false));
it('times out a provider that ignores abort', async () =>
  expect(
    await extract(
      { version: 'test', transcribe: () => new Promise(() => {}) },
      new Uint8Array(),
      'q',
      5,
    ),
  ).toMatchObject({ ok: false, code: 'TIMEOUT' }));
