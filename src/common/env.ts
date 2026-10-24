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

/** Secret used to sign customer session cookies. */
export function getCustomerSessionSecret(): string {
  return readRequired('CUSTOMER_SESSION_SECRET');
}

/** Firebase project ID used by the Admin SDK to verify phone-auth tokens. */
export function getFirebaseProjectId(): string {
  const value =
    process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!value) {
    throw new Error('Missing required environment variable: FIREBASE_PROJECT_ID');
  }
  return value;
}

/** Firebase service-account client email used by the Admin SDK. */
export function getFirebaseClientEmail(): string {
  return readRequired('FIREBASE_CLIENT_EMAIL');
}

/** Firebase service-account private key used by the Admin SDK. */
export function getFirebasePrivateKey(): string {
  return readRequired('FIREBASE_PRIVATE_KEY');
}

/** WhatsApp Cloud API permanent/system-user access token. */
export function getWhatsAppAccessToken(): string {
  return readRequired('WHATSAPP_ACCESS_TOKEN');
}

/** ID of the WhatsApp sender phone number (Meta test number in development). */
export function getWhatsAppPhoneNumberId(): string {
  const value = readRequired('WHATSAPP_PHONE_NUMBER_ID').trim();
  if (!/^\d{5,25}$/.test(value)) {
    throw new Error('Invalid WHATSAPP_PHONE_NUMBER_ID: expected a numeric ID');
  }
  return value;
}

/** App secret used to verify `X-Hub-Signature-256` on WhatsApp webhooks. */
export function getWhatsAppAppSecret(): string {
  return readRequired('WHATSAPP_APP_SECRET');
}

/** Token Meta echoes back during webhook subscription verification. */
export function getWhatsAppVerifyToken(): string {
  return readRequired('WHATSAPP_VERIFY_TOKEN');
}

/** Graph API version, e.g. `v23.0`. The value is never echoed in errors. */
export function getWhatsAppApiVersion(): string {
  const value = readRequired('WHATSAPP_API_VERSION').trim();
  if (!/^v\d{1,3}\.\d{1,2}$/.test(value)) {
    throw new Error('Invalid WHATSAPP_API_VERSION: expected a Graph API version like "v23.0"');
  }
  return value;
}

/** Active payments provider id (e.g. `razorpay`). Defaults to `razorpay`. */
export function getPaymentProviderId(): string {
  return process.env.PAYMENT_PROVIDER?.trim() || 'razorpay';
}

/** Razorpay API key ID (the public key; also used in Basic auth server-side). */
export function getRazorpayKeyId(): string {
  return readRequired('RAZORPAY_KEY_ID');
}

/** Razorpay API key secret. Server-only — never prefix with NEXT_PUBLIC_. */
export function getRazorpayKeySecret(): string {
  return readRequired('RAZORPAY_KEY_SECRET');
}

/** Number of days after delivery during which a customer may request a return. */
export function getReturnWindowDays(): number {
  const days = Number(readRequired('RETURN_WINDOW_DAYS'));
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('Invalid RETURN_WINDOW_DAYS: expected a positive integer');
  }
  return days;
}

/** True during the Next.js production build phase. */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
