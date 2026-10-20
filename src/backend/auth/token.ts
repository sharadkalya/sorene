import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Pure HMAC-signed admin token helpers. Kept free of any Next.js imports so the
 * signing/verification logic can be unit-tested without a request context.
 */

export const ADMIN_SESSION_COOKIE = 'sorvene_admin_session';
export const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function hmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signAdminToken(
  secret: string,
  opts: { now?: number; ttlMs?: number } = {},
): string {
  const now = opts.now ?? Date.now();
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const payload = toBase64Url(JSON.stringify({ sub: 'admin', iat: now, exp: now + ttlMs }));
  return `${payload}.${hmac(payload, secret)}`;
}

export function verifyAdminToken(token: string, secret: string): boolean {
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length > 0) {
    return false;
  }

  const expected = hmac(payload, secret);
  const actual = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
    };
    return typeof decoded.exp === 'number' && decoded.exp >= Date.now();
  } catch {
    return false;
  }
}
