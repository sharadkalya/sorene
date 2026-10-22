import { describe, expect, it } from 'vitest';
import { signCustomerToken, verifyCustomerToken } from './customer-token';

const SECRET = 'test-secret-that-is-long-enough';

describe('customer session token', () => {
  it('round-trips a valid token with the customer payload', () => {
    const token = signCustomerToken(SECRET, { customerId: 'c1', phone: '+919876543210' });
    expect(verifyCustomerToken(token, SECRET)).toEqual({
      customerId: 'c1',
      phone: '+919876543210',
    });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signCustomerToken(SECRET, { customerId: 'c1', phone: '+919876543210' });
    expect(verifyCustomerToken(token, 'another-secret')).toBeNull();
  });

  it('rejects tampered payloads', () => {
    const token = signCustomerToken(SECRET, { customerId: 'c1', phone: '+919876543210' });
    const [payload, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'c2', phone: '+919999999999', iat: 1, exp: 99_999_999_999 }),
    ).toString('base64url');
    expect(verifyCustomerToken(`${tamperedPayload}.${signature}`, SECRET)).toBeNull();
    expect(verifyCustomerToken(`${payload}.AAAA`, SECRET)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const token = signCustomerToken(
      SECRET,
      { customerId: 'c1', phone: '+919876543210' },
      { now: 1_000_000, ttlMs: 1000 },
    );
    const originalNow = Date.now;
    Date.now = () => 2_000_000;
    try {
      expect(verifyCustomerToken(token, SECRET)).toBeNull();
    } finally {
      Date.now = originalNow;
    }
  });

  it('rejects malformed tokens', () => {
    expect(verifyCustomerToken('', SECRET)).toBeNull();
    expect(verifyCustomerToken('garbage', SECRET)).toBeNull();
    expect(verifyCustomerToken('a.b.c', SECRET)).toBeNull();
    expect(verifyCustomerToken('not-base64url!.sig', SECRET)).toBeNull();
  });
});
