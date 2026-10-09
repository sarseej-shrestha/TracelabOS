import { ocrSchema, type OcrResult } from '../../contracts/src/index.ts';
export interface VisionProvider {
  readonly version: string;
  transcribe(image: Uint8Array, signal: AbortSignal): Promise<unknown>;
}
export type Extraction =
  | { ok: true; data: OcrResult }
  | {
      ok: false;
      code: 'UNAVAILABLE' | 'TIMEOUT' | 'INVALID_OUTPUT' | 'PROVIDER_ERROR';
      manualEntry: true;
    };
export async function extract(
  provider: VisionProvider | undefined,
  image: Uint8Array,
  questionId: string,
  timeoutMs = 15000,
): Promise<Extraction> {
  if (!provider) return { ok: false, code: 'UNAVAILABLE', manualEntry: true };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const output = await Promise.race([
      provider.transcribe(image, controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('timeout'));
        }, timeoutMs);
      }),
    ]);
    const result = ocrSchema.safeParse(output);
    if (
      !result.success ||
      result.data.questionId !== questionId ||
      result.data.modelVersion !== provider.version
    )
      return { ok: false, code: 'INVALID_OUTPUT', manualEntry: true };
    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      code: controller.signal.aborted ? 'TIMEOUT' : 'PROVIDER_ERROR',
      manualEntry: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
export function validateImage(bytes: Uint8Array, mime: string) {
  if (bytes.length < 12 || bytes.length > 5 * 1024 * 1024)
    throw new Error('Image must be between 12 bytes and 5 MiB.');
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!(mime === 'image/png' && png) && !(mime === 'image/jpeg' && jpeg))
    throw new Error('Use a PNG or JPEG with a matching file signature.');
  // Signature validation is one layer, not proof of a decodable image.
}
