import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import {
  extract,
  VisionFailure,
} from '../../packages/vision-adapter/src/index.ts';
import { HttpVisionProvider } from '../../packages/vision-adapter/src/http.ts';
import {
  hostedModel,
  hostedVisionVersion,
  maxHostedImageBytes,
  hostedModelInput,
  parseHostedTranscription,
  WorkersAiVisionProvider,
  type HostedModelRunner,
} from '../../packages/vision-adapter/src/workers-ai.ts';
const image = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const lines = ['3(x-2)=15', '3x-2=15', 'x=17/3'];
it.each([
  JSON.stringify({ lines }),
  { lines },
  '```json\n' + JSON.stringify({ lines }) + '\n```',
])(
  'accepts measured payload shape while preserving errors and provenance',
  (response) => {
    const result = parseHostedTranscription(
      { response, model: '@cf/mistralai/mistral-small-3.1-24b-v2' },
      'q',
    );
    expect(result.lines.map((l) => l.raw)).toEqual(lines);
    expect(result.status).toBe('needs_confirmation');
    expect(result.modelVersion).toBe(hostedVisionVersion);
    expect(result.provenance).toEqual({
      provider: 'cloudflare-workers-ai',
      requestedModel: hostedModel,
      returnedModel: '@cf/mistralai/mistral-small-3.1-24b-v2',
      response,
    });
    expect(
      result.lines.every((l) => !('bbox' in l) && !('confidence' in l)),
    ).toBe(true);
    expect(result).not.toHaveProperty('grade');
  },
);
it('leaves absent returned model identity absent', () =>
  expect(
    parseHostedTranscription({ response: { lines } }, 'q').provenance,
  ).not.toHaveProperty('returnedModel'));
it.each([
  {},
  { response: null },
  { response: '{}' },
  { response: { lines: [] } },
  { response: { lines: [''] } },
  { response: { lines: ['   '] } },
  { response: { lines: [42] } },
  { response: { lines: ['x'.repeat(513)] } },
  { response: { lines: Array(25).fill('x') } },
  { response: { lines, grade: 'correct' } },
  { response: 'prefix {"lines":["x"]}' },
  { response: '{"lines":["\\frac{1}{2}"]}' },
  { response: { lines }, model: 'invalid model with spaces' },
  { response: 'x'.repeat(8193) },
  { response: { lines: Array(24).fill('x'.repeat(400)) } },
])('rejects malformed or excessive model output %#', (output) => {
  expect(() => parseHostedTranscription(output, 'q')).toThrow('INVALID_OUTPUT');
});
it('bounds multibyte output by bytes', () =>
  expect(() =>
    parseHostedTranscription(
      { response: { lines: Array(10).fill('数'.repeat(300)) } },
      'q',
    ),
  ).toThrow('INVALID_OUTPUT'));
it('rejects cyclic output without leaking the provider error', () => {
  const response: Record<string, unknown> = {};
  response.self = response;
  expect(() => parseHostedTranscription({ response }, 'q')).toThrow(
    'INVALID_OUTPUT',
  );
});
it('replays every captured Mistral response, including the original invalid JSON', () => {
  const report = JSON.parse(
    readFileSync(
      new URL('../../artifacts/ocr-hosted-pilot.json', import.meta.url),
      'utf8',
    ),
  );
  const candidate = report.candidates.find(
    (c: { candidate: string }) => c.candidate === 'mistral',
  );
  expect(candidate.rows).toHaveLength(8);
  let valid = 0;
  for (const row of candidate.rows) {
    if (row.error_category === 'invalid_output')
      expect(() => parseHostedTranscription(row.raw_result, 'q')).toThrow(
        'INVALID_OUTPUT',
      );
    else {
      const result = parseHostedTranscription(row.raw_result, 'q');
      expect(result.lines.map((l) => l.raw).join('\n')).toBe(row.predicted);
      valid++;
    }
  }
  expect(valid).toBe(7);
});
it('uses a fixed prompt and bounded model request without answers or tools', () => {
  const input = hostedModelInput(image);
  expect(input).toMatchObject({
    max_tokens: 512,
    temperature: 0,
    stream: false,
  });
  expect(input.messages[0]?.content[1]).toEqual({
    type: 'image_url',
    image_url: {
      url: `data:image/png;base64,${Buffer.from(image).toString('base64')}`,
    },
  });
  expect(input).not.toHaveProperty('tools');
});
it.each([
  new Uint8Array(),
  new Uint8Array(12),
  new Uint8Array(maxHostedImageBytes + 1),
])('rejects invalid/large image before inference %#', async (bytes) => {
  const run = vi.fn();
  const provider = new WorkersAiVisionProvider(run);
  expect(await extract(provider, bytes, 'q')).toMatchObject({
    ok: false,
    code: 'INVALID_OUTPUT',
    manualEntry: true,
  });
  expect(run).not.toHaveBeenCalled();
});
it('uses the trusted question ID and one fixed model request', async () => {
  const run = vi.fn<HostedModelRunner>(async () => ({ response: { lines } }));
  const provider = new WorkersAiVisionProvider(run);
  const result = await extract(provider, image, 'trusted-question');
  expect(run).toHaveBeenCalledOnce();
  expect(run.mock.calls[0]?.[0]).toBe(hostedModel);
  expect(result).toMatchObject({
    ok: true,
    data: { questionId: 'trusted-question', status: 'needs_confirmation' },
  });
});
it('aborts before any call when already cancelled', async () => {
  const run = vi.fn();
  const signal = AbortSignal.abort();
  await expect(
    new WorkersAiVisionProvider(run).transcribe(image, signal, 'q'),
  ).rejects.toThrow();
  expect(run).not.toHaveBeenCalled();
});
it('timeout cancels transport and cannot produce a successful extraction', async () => {
  const run = vi.fn(
    (_model, _input, signal: AbortSignal) =>
      new Promise((_, reject) =>
        signal.addEventListener('abort', () =>
          reject(new Error('private details')),
        ),
      ),
  );
  expect(
    await extract(new WorkersAiVisionProvider(run), image, 'q', 5),
  ).toEqual({ ok: false, code: 'TIMEOUT', manualEntry: true });
});
it('keeps quota exhaustion distinct from retryable transport failures', async () => {
  const run = vi.fn(async () => {
    throw new VisionFailure('QUOTA_EXHAUSTED');
  });
  expect(await extract(new WorkersAiVisionProvider(run), image, 'q')).toEqual({
    ok: false,
    code: 'QUOTA_EXHAUSTED',
    manualEntry: true,
  });
});
it('maps HTTP 429 to a non-retryable quota failure', async () => {
  const provider = new HttpVisionProvider(
    'https://ocr.example/transcribe',
    'x'.repeat(32),
    hostedVisionVersion,
    async () => new Response(null, { status: 429 }),
  );
  expect(await extract(provider, image, 'q')).toEqual({
    ok: false,
    code: 'QUOTA_EXHAUSTED',
    manualEntry: true,
  });
});
