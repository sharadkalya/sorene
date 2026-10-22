import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Self-managed OTP primitives. Codes are short (6 digits), so they are hashed
 * with an HMAC keyed by a server-side secret (never stored in plaintext) and
 * compared in constant time. The key material never touches the database.
 */

export const OTP_CODE_LENGTH = 6;

export function generateOtpCode(length: number = OTP_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

function hmac(secret: string, data: string): Buffer {
  return createHmac('sha256', secret).update(data).digest();
}

export function hashOtpCode(secret: string, phone: string, code: string): string {
  return hmac(secret, `${phone}:${code}`).toString('base64url');
}

export function verifyOtpCode(
  secret: string,
  phone: string,
  code: string,
  expectedHash: string,
): boolean {
  const actual = hmac(secret, `${phone}:${code}`);
  const expected = Buffer.from(expectedHash, 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
