import { describe, expect, it } from 'vitest';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from './otp';

const SECRET = 'test-secret-that-is-long-enough';

describe('otp primitives', () => {
  it('generates a 6-digit numeric code', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('round-trips a hashed code for the same phone', () => {
    const code = generateOtpCode();
    const hash = hashOtpCode(SECRET, '+919876543210', code);
    expect(verifyOtpCode(SECRET, '+919876543210', code, hash)).toBe(true);
  });

  it('rejects a different code or phone', () => {
    const hash = hashOtpCode(SECRET, '+919876543210', '123456');
    expect(verifyOtpCode(SECRET, '+919876543210', '654321', hash)).toBe(false);
    expect(verifyOtpCode(SECRET, '+911111111111', '123456', hash)).toBe(false);
  });

  it('rejects a hash produced with a different secret', () => {
    const hash = hashOtpCode(SECRET, '+919876543210', '123456');
    expect(verifyOtpCode('another-secret', '+919876543210', '123456', hash)).toBe(false);
  });
});
