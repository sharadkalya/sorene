import { describe, expect, it } from 'vitest';
import { otpRequestSchema, otpVerifySchema } from './otp.validation';

describe('otpRequestSchema', () => {
  it('accepts an E.164 phone number', () => {
    expect(otpRequestSchema.safeParse({ phone: '+919876543210' }).success).toBe(true);
  });

  it('rejects non-E.164 numbers', () => {
    expect(otpRequestSchema.safeParse({ phone: '9876543210' }).success).toBe(false);
    expect(otpRequestSchema.safeParse({ phone: 'abc' }).success).toBe(false);
    expect(otpRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('otpVerifySchema', () => {
  it('accepts a phone + 6-digit code', () => {
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', code: '123456' }).success).toBe(true);
  });

  it('rejects a malformed code', () => {
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', code: '12345' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', code: '12345a' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ phone: 'bad', code: '123456' }).success).toBe(false);
  });
});
