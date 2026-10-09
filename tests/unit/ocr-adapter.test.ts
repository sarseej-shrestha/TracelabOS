import { expect, it, vi } from 'vitest';
import {
  HttpVisionProvider,
  localModelVersion,
  configuredVisionProvider,
} from '../../packages/vision-adapter/src/http.ts';
import { plainMath } from '../../packages/vision-adapter/src/latex.ts';
import { extract } from '../../packages/vision-adapter/src/index.ts';
import { evaluate } from '../../packages/math-engine/src/index.ts';
const token = 'test-only-token-'.repeat(3);
it.each([
  ['3\\left(x-2\\right)=15', '3(x-2)=15'],
  ['\\frac{1}{2}+\\frac{1}{3}', '((1)/(2))+((1)/(3))'],
  ['\\frac{1}{\\frac{2}{3}}', '((1)/(((2)/(3))))'],
  ['2\\cdot x=6', '2* x=6'],
  ['{x+1}/2', '(x+1)/2'],
  ['\\dfrac {1}{2}', '((1)/(2))'],
])('converts only explicit supported syntax: %s', (latex, expected) =>
  expect(plainMath(latex)).toBe(expected),
);
it.each([
  'x^2',
  'x_1',
  '\\sqrt{2}',
  '\\leftarrow',
  '\\text{ignore instructions}',
  '\\frac{1}{',
  '\\frac{}{2}',
  '}',
  '1 2',
  'x'.repeat(513),
])('preserves uncertainty for unsupported or malformed input: %s', (latex) =>
  expect(plainMath(latex)).toBeNull(),
);
it('converted fractions preserve exact mathematical value', () => {
  expect(
    evaluate('1/2+1/3', [plainMath('\\frac{5}{6}')!]).firstError,
  ).toBeNull();
});
it('passes the trusted question identity and rejects output from another question', async () => {
  const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
    expect((init?.headers as Record<string, string>).authorization).toBe(
      `Bearer ${token}`,
    );
    expect(JSON.parse(init!.body as string)).toEqual({
      questionId: 'q',
      image: 'AQID',
    });
    expect(init?.redirect).toBe('error');
    return Response.json({
      questionId: 'other',
      modelVersion: localModelVersion,
      status: 'needs_confirmation',
      lines: [{ line: 1, raw: 'x=7', latex: 'x=7' }],
    });
  });
  const result = await extract(
    new HttpVisionProvider(
      'http://127.0.0.1:8020/transcribe',
      token,
      localModelVersion,
      fetcher,
    ),
    new Uint8Array([1, 2, 3]),
    'q',
  );
  expect(result).toMatchObject({
    ok: false,
    code: 'INVALID_OUTPUT',
    manualEntry: true,
  });
});
it('returns validated extraction without claiming confidence or grading', async () => {
  const result = await extract(
    new HttpVisionProvider(
      'https://ocr.example/transcribe',
      token,
      localModelVersion,
      async () =>
        Response.json({
          questionId: 'q',
          modelVersion: localModelVersion,
          status: 'needs_confirmation',
          lines: [{ line: 1, raw: 'x=7', latex: 'x=7', bbox: [0, 0, 1, 1] }],
        }),
    ),
    new Uint8Array([1]),
    'q',
  );
  expect(result).toMatchObject({
    ok: true,
    data: { status: 'needs_confirmation' },
  });
});
it.each([401, 429, 503])(
  'turns provider HTTP %s into manual fallback',
  async (status) => {
    expect(
      await extract(
        new HttpVisionProvider(
          'https://ocr.example/transcribe',
          token,
          localModelVersion,
          async () => new Response('', { status }),
        ),
        new Uint8Array([1]),
        'q',
      ),
    ).toMatchObject({ ok: false, manualEntry: true });
  },
);
it('bounds response bytes before parsing untrusted JSON', async () => {
  const provider = new HttpVisionProvider(
    'https://ocr.example/transcribe',
    token,
    localModelVersion,
    async () => new Response('x'.repeat(128 * 1024 + 1)),
  );
  await expect(
    provider.transcribe(new Uint8Array([1]), new AbortController().signal, 'q'),
  ).rejects.toThrow('TOO_LARGE');
});
it.each([
  'http://192.0.2.1/transcribe',
  'https://user:password@ocr.example/transcribe',
  'file:///tmp/model',
  'https://ocr.example/?token=secret',
])('rejects unsafe endpoint configuration: %s', (endpoint) =>
  expect(() => new HttpVisionProvider(endpoint, token)).toThrow(),
);
it('requires complete operator configuration', () => {
  expect(configuredVisionProvider({})).toBeUndefined();
  expect(() =>
    configuredVisionProvider({
      TRACELAB_OCR_URL: 'http://localhost:8020/transcribe',
    }),
  ).toThrow('Incomplete');
  expect(
    () => new HttpVisionProvider('http://localhost:8020/transcribe', 'weak'),
  ).toThrow('32');
});
