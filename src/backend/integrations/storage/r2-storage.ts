import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getR2BucketName, getR2PublicUrl } from '@/common/env';
import { AppError } from '@/backend/errors';
import { getR2Client } from './r2-client';

export interface StorageHealth {
  ok: boolean;
  bucket?: string;
  key?: string;
  deleted?: boolean;
  latencyMs?: number;
  error?: string;
}

// 1x1 transparent PNG — a minimal valid image for the upload/delete round-trip.
const TEST_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z6v0AAAAASUVORK5CYII=',
  'base64',
);

export interface UploadedImage {
  key: string;
  url: string;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB per image.

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** Build the public URL for a stored object key. */
export function buildPublicUrl(key: string): string {
  const base = getR2PublicUrl().replace(/\/+$/, '');
  return `${base}/${key}`;
}

/**
 * Store an image buffer in R2 and return its public URL. Validates content
 * type and size so callers can safely persist the returned URL in the database.
 */
export async function uploadImage(opts: {
  buffer: Buffer;
  contentType: string;
  folder: string;
}): Promise<UploadedImage> {
  const extension = IMAGE_EXTENSIONS[opts.contentType];
  if (!extension) {
    throw new AppError('VALIDATION_ERROR', `Unsupported image type: ${opts.contentType || 'unknown'}`);
  }
  if (opts.buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Each image must be smaller than 10MB.');
  }

  const key = `${opts.folder.replace(/^\/+|\/+$/g, '')}/${randomUUID()}.${extension}`;
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: opts.buffer,
      ContentType: opts.contentType,
    }),
  );

  return { key, url: buildPublicUrl(key) };
}

/**
 * Verify R2 is usable by uploading a tiny object and deleting it again.
 * Never throws for expected failures — it reports them in the result so the
 * status endpoint can return a meaningful body instead of a generic 500.
 */
export async function checkStorageHealth(): Promise<StorageHealth> {
  const started = Date.now();
  const key = `status-checks/${randomUUID()}.png`;

  try {
    const bucket = getR2BucketName();
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: TEST_IMAGE,
        ContentType: 'image/png',
      }),
    );
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return { ok: true, bucket, key, deleted: true, latencyMs: Date.now() - started };
  } catch (error) {
    console.error('R2 storage health check failed:', error);
    return {
      ok: false,
      deleted: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }
}
