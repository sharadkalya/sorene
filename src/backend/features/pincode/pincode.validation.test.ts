import { describe, expect, it } from 'vitest';
import { pincodeInputSchema } from './pincode.validation';

describe('pincodeInputSchema', () => {
  it('accepts a valid 6-digit pincode', () => {
    const result = pincodeInputSchema.safeParse('682028');
    expect(result.success).toBe(true);
    expect(result.data).toBe('682028');
  });

  it('trims surrounding whitespace', () => {
    const result = pincodeInputSchema.safeParse(' 400001 ');
    expect(result.success).toBe(true);
    expect(result.data).toBe('400001');
  });

  it('rejects a pincode whose first digit is 0', () => {
    expect(pincodeInputSchema.safeParse('012345').success).toBe(false);
  });

  it('rejects a pincode that is too short', () => {
    expect(pincodeInputSchema.safeParse('12345').success).toBe(false);
  });

  it('rejects a pincode that is too long', () => {
    expect(pincodeInputSchema.safeParse('1234567').success).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(pincodeInputSchema.safeParse('12a456').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(pincodeInputSchema.safeParse('').success).toBe(false);
  });

  it('rejects a non-string value', () => {
    expect(pincodeInputSchema.safeParse(400001).success).toBe(false);
  });
});
