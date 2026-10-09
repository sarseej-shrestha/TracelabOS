import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
export const imagePrefix = 'tracelab-images/v1/';
export interface ImageStore {
  readonly kind: string;
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  list(
    cursor?: string,
  ): Promise<{ objects: { key: string; modified: Date }[]; cursor?: string }>;
}
export class StorageUnavailable extends Error {
  constructor() {
    super('IMAGE_STORAGE_UNAVAILABLE');
  }
}
const assertKey = (key: string) => {
  if (!/^tracelab-images\/v1\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/.test(key))
    throw new Error('Invalid image object key');
};
/** The bucket must have public access disabled. Objects are accessed only through the authorized API. */
export class R2ImageStore implements ImageStore {
  readonly kind = 'private-r2';
  constructor(
    private client: S3Client,
    private bucket: string,
  ) {}
  async put(key: string, bytes: Uint8Array) {
    assertKey(key);
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('Image size limit');
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: bytes,
          ContentType: 'image/jpeg',
          CacheControl: 'private, no-store',
        }),
        { abortSignal: AbortSignal.timeout(10000) },
      );
    } catch {
      throw new StorageUnavailable();
    }
  }
  async get(key: string) {
    assertKey(key);
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(10000) },
      );
      if (
        !response.Body ||
        (response.ContentLength ?? Infinity) > 5 * 1024 * 1024
      )
        throw new StorageUnavailable();
      const bytes = await response.Body.transformToByteArray();
      if (bytes.byteLength > 5 * 1024 * 1024) throw new StorageUnavailable();
      return bytes;
    } catch {
      throw new StorageUnavailable();
    }
  }
  async delete(key: string) {
    assertKey(key);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(10000) },
      );
    } catch {
      throw new StorageUnavailable();
    }
  }
  async list(cursor?: string) {
    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: imagePrefix,
          MaxKeys: 200,
          ContinuationToken: cursor,
        }),
        { abortSignal: AbortSignal.timeout(10000) },
      );
      return {
        objects: (response.Contents ?? [])
          .filter((o) => o.Key && o.LastModified)
          .map((o) => ({ key: o.Key!, modified: o.LastModified! })),
        cursor: response.IsTruncated
          ? response.NextContinuationToken
          : undefined,
      };
    } catch {
      throw new StorageUnavailable();
    }
  }
}
export function configuredImageStore(
  env: Record<string, string | undefined> = process.env,
): ImageStore | undefined {
  const keys = [
    'R2_BUCKET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
  ] as const;
  if (!keys.some((key) => env[key])) return undefined;
  if (
    !keys.every((key) => env[key]) ||
    !/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID ?? '')
  )
    throw new Error('Incomplete R2 configuration');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
    maxAttempts: 2,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return new R2ImageStore(client, env.R2_BUCKET!);
}
