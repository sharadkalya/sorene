import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verify Meta's `X-Hub-Signature-256` header: `sha256=` + hex HMAC-SHA256 of
 * the exact raw request body, keyed with the app secret. Constant-time compare;
 * fails closed on any malformed input.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX) || !appSecret) {
    return false;
  }
  const provided = signatureHeader.slice(SIGNATURE_PREFIX.length);
  if (!/^[0-9a-f]{64}$/i.test(provided)) {
    return false;
  }
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(provided, 'hex'));
}

/** Constant-time string comparison that does not leak length via early exit. */
export function safeEqual(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a).digest();
  const digestB = createHash('sha256').update(b).digest();
  return timingSafeEqual(digestA, digestB);
}
