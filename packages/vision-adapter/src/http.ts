import type { VisionProvider } from './index.ts';
export const localModelVersion = 'pix2text-mfr-1.5@1cef9f0:regions-v1';
/** Only operator configuration supplies this URL; uploaded content never controls destinations. */
export class HttpVisionProvider implements VisionProvider {
  readonly version: string;
  private endpoint: URL;
  constructor(
    endpoint: string,
    private token: string,
    version = localModelVersion,
    private fetcher: typeof fetch = fetch,
  ) {
    this.endpoint = new URL(endpoint);
    if (
      this.endpoint.username ||
      this.endpoint.password ||
      this.endpoint.search ||
      this.endpoint.hash ||
      (this.endpoint.protocol !== 'https:' &&
        !(
          this.endpoint.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(this.endpoint.hostname)
        ))
    )
      throw new Error('Use HTTPS or a localhost OCR endpoint');
    if (token.length < 32)
      throw new Error('OCR token must have at least 32 characters');
    this.version = version;
  }
  async transcribe(
    image: Uint8Array,
    signal: AbortSignal,
    questionId?: string,
  ): Promise<unknown> {
    if (!questionId || image.length > 5 * 1024 * 1024)
      throw new Error('Invalid OCR input');
    const response = await this.fetcher(this.endpoint, {
      method: 'POST',
      signal,
      redirect: 'error',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        image: Buffer.from(image).toString('base64'),
      }),
    });
    if (!response.ok || !response.body)
      throw new Error('OCR_PROVIDER_UNAVAILABLE');
    const reader = response.body.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > 128 * 1024) throw new Error('OCR_OUTPUT_TOO_LARGE');
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
}
export function configuredVisionProvider(
  env: Record<string, string | undefined> = process.env,
) {
  if (!env.TRACELAB_OCR_URL && !env.TRACELAB_OCR_TOKEN) return undefined;
  if (!env.TRACELAB_OCR_URL || !env.TRACELAB_OCR_TOKEN)
    throw new Error('Incomplete OCR configuration');
  return new HttpVisionProvider(env.TRACELAB_OCR_URL, env.TRACELAB_OCR_TOKEN);
}
