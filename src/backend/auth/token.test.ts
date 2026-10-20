import { describe, expect, it } from 'vitest';
import { signAdminToken, verifyAdminToken } from './token';

const SECRET = 'test-secret-that-is-long-enough';

describe('admin session token', () => {
  it('round-trips a valid token', () => {
    const token = signAdminToken(SECRET, { now: Date.now(), ttlMs: 60_000 });
    expect(verifyAdminToken(token, SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAdminToken(SECRET, { now: 1_000_000, ttlMs: 60_000 });
    expect(verifyAdminToken(token, 'another-secret')).toBe(false);
  });

  it('rejects tampered payloads', () => {
    const token = signAdminToken(SECRET, { now: 1_000_000, ttlMs: 60_000 });
    const [payload, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin', iat: 1_000_000, exp: 99_999_999 }),
    ).toString('base64url');
    expect(verifyAdminToken(`${tamperedPayload}.${signature}`, SECRET)).toBe(false);
    expect(verifyAdminToken(`${payload}.AAAA`, SECRET)).toBe(false);
  });

  it('rejects expired tokens', () => {
    const token = signAdminToken(SECRET, { now: 1_000_000, ttlMs: 1000 });
    // exp is 1_001_000, so verifying "now" beyond that fails.
    const originalNow = Date.now;
    Date.now = () => 2_000_000;
    try {
      expect(verifyAdminToken(token, SECRET)).toBe(false);
    } finally {
      Date.now = originalNow;
    }
  });

  it('rejects malformed tokens', () => {
    expect(verifyAdminToken('', SECRET)).toBe(false);
    expect(verifyAdminToken('garbage', SECRET)).toBe(false);
    expect(verifyAdminToken('a.b.c', SECRET)).toBe(false);
    expect(verifyAdminToken('not-base64url!.sig', SECRET)).toBe(false);
  });
});
