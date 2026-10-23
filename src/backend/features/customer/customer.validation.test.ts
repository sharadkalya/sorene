import { describe, expect, it } from 'vitest';
import { addressInputSchema, profileUpdateSchema } from './customer.validation';

const VALID_ADDRESS = {
  fullName: 'Jane Doe',
  phone: '+91 98765 43210',
  line1: '12 Palm Road',
  line2: 'Apt 4',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

describe('addressInputSchema', () => {
  it('accepts a valid address', () => {
    const result = addressInputSchema.safeParse(VALID_ADDRESS);
    expect(result.success).toBe(true);
    expect(result.data?.phone).toBe('+91 98765 43210');
  });

  it('accepts an address without the optional second line', () => {
    const { fullName, phone, line1, city, state, pincode } = VALID_ADDRESS;
    expect(
      addressInputSchema.safeParse({ fullName, phone, line1, city, state, pincode }).success,
    ).toBe(true);
  });

  it('rejects a missing required field', () => {
    expect(addressInputSchema.safeParse({ ...VALID_ADDRESS, city: undefined }).success).toBe(false);
  });

  it('rejects a short name', () => {
    expect(addressInputSchema.safeParse({ ...VALID_ADDRESS, fullName: 'J' }).success).toBe(false);
  });

  it('rejects an invalid postal code', () => {
    expect(addressInputSchema.safeParse({ ...VALID_ADDRESS, pincode: 'abc' }).success).toBe(false);
  });

  it('rejects an empty phone number', () => {
    expect(addressInputSchema.safeParse({ ...VALID_ADDRESS, phone: '' }).success).toBe(false);
  });
});

describe('profileUpdateSchema', () => {
  it('accepts an empty patch', () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid name and email', () => {
    const result = profileUpdateSchema.safeParse({ name: 'Jane Doe', email: ' Jane@Example.com ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('jane@example.com');
    }
  });

  it('rejects an invalid email', () => {
    expect(profileUpdateSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a name that is too short', () => {
    expect(profileUpdateSchema.safeParse({ name: 'J' }).success).toBe(false);
  });

  it('transforms an empty email to undefined (so the service can clear it)', () => {
    const result = profileUpdateSchema.safeParse({ email: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });

  it('lowercases and trims a valid email', () => {
    const result = profileUpdateSchema.safeParse({ email: '  JANE@EXAMPLE.COM  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('jane@example.com');
    }
  });
});
