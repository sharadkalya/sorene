import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Pure HMAC-signed customer session token helpers. Mirrors `token.ts` for the
 * admin session but carries a customer identity (`customerId` + `phone`) so
 * server components and route handlers can resolve the authenticated shopper.
 */

export const CUSTOMER_SESSION_COOKIE = 'sorvene_customer_session';
export const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CustomerSessionPayload {
  customerId: string;
  phone: string;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function hmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signCustomerToken(
  secret: string,
  payload: CustomerSessionPayload,
  opts: { now?: number; ttlMs?: number } = {},
): string {
  const now = opts.now ?? Date.now();
  const ttlMs = opts.ttlMs ?? CUSTOMER_TTL_MS;
  const body = toBase64Url(
    JSON.stringify({ sub: payload.customerId, phone: payload.phone, iat: now, exp: now + ttlMs }),
  );
  return `${body}.${hmac(body, secret)}`;
}

export function verifyCustomerToken(token: string, secret: string): CustomerSessionPayload | null {
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length > 0) {
    return null;
  }

  const expected = hmac(payload, secret);
  const actual = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
      phone?: unknown;
      exp?: unknown;
    };
    if (
      typeof decoded.sub !== 'string' ||
      typeof decoded.phone !== 'string' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp < Date.now()
    ) {
      return null;
    }
    return { customerId: decoded.sub, phone: decoded.phone };
  } catch {
    return null;
  }
}
