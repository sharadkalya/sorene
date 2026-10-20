import { S3Client } from '@aws-sdk/client-s3';
import { getR2AccessKeyId, getR2AccountId, getR2SecretAccessKey } from '@/common/env';

/**
 * Lazily-constructed S3 client pointed at Cloudflare R2's S3-compatible API.
 * Credentials and endpoint are read from environment variables at first use.
 */

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${getR2AccountId()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getR2AccessKeyId(),
        secretAccessKey: getR2SecretAccessKey(),
      },
      forcePathStyle: true,
    });
  }
  return client;
}
