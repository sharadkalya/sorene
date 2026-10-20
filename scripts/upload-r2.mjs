// Upload a local file to Cloudflare R2 and print its public URL.
// Usage: node --env-file=.env.local scripts/upload-r2.mjs <file> [key]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

const [file, keyArg] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/upload-r2.mjs <file> [key]');
  process.exit(1);
}

const key = keyArg || `uploads/${basename(file)}`;
const bucket = required('R2_BUCKET_NAME');
const accountId = required('CLOUDFLARE_ACCOUNT_ID');
const publicUrl = required('R2_PUBLIC_URL').replace(/\/+$/, '');

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const contentType =
  CONTENT_TYPES[Object.keys(CONTENT_TYPES).find((ext) => file.toLowerCase().endsWith(ext)) ?? ''] ??
  'application/octet-stream';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  },
  forcePathStyle: true,
});

const body = readFileSync(file);

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }),
);

console.log(`${publicUrl}/${key}`);
