/**
 * Centralized, lazily-evaluated access to environment configuration.
 *
 * Reading lazily (instead of at module load) ensures both `next build` and
 * runtime see the correct process environment, and lets integrations fail
 * with a clear message exactly at the point where the value is needed.
 */

function readRequired(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** MongoDB Atlas connection string. */
export function getMongoUri(): string {
  return readRequired('MONGODB_URI');
}

/** Resend API key used by the email integration. */
export function getResendApiKey(): string {
  return readRequired('RESEND_API_KEY');
}

/** Domain used for outbound email `From` addresses and links. */
export function getEmailDomain(): string {
  return process.env.EMAIL_DOMAIN?.trim() || 'sorvenestudio.com';
}

/** Admin login username. Admin login is disabled when unset. */
export function getAdminUsername(): string | undefined {
  return process.env.ADMIN_USERNAME?.trim() || undefined;
}

/** Admin login password. Admin login is disabled when unset. */
export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

/** Secret used to sign admin session cookies. */
export function getAdminSessionSecret(): string {
  return readRequired('ADMIN_SESSION_SECRET');
}

/** Cloudflare account ID used to build the R2 endpoint. */
export function getR2AccountId(): string {
  return readRequired('CLOUDFLARE_ACCOUNT_ID');
}

/** R2 S3-compatible API access key ID. */
export function getR2AccessKeyId(): string {
  return readRequired('R2_ACCESS_KEY_ID');
}

/** R2 S3-compatible API secret access key. */
export function getR2SecretAccessKey(): string {
  return readRequired('R2_SECRET_ACCESS_KEY');
}

/** R2 bucket that stores product media. */
export function getR2BucketName(): string {
  return readRequired('R2_BUCKET_NAME');
}

/** Public base URL that serves objects from the R2 bucket. */
export function getR2PublicUrl(): string {
  return readRequired('R2_PUBLIC_URL');
}

/** True during the Next.js production build phase. */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
