import { describe, expect, it } from 'vitest';
import { subscriberInputSchema } from './subscriber.validation';

describe('subscriberInputSchema', () => {
  it('accepts valid input and normalizes it', () => {
    const result = subscriberInputSchema.safeParse({
      name: '  Jane Doe  ',
      email: '  Jane.Doe@Example.COM ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.email).toBe('jane.doe@example.com');
    }
  });

  it('rejects missing fields', () => {
    expect(subscriberInputSchema.safeParse({}).success).toBe(false);
    expect(subscriberInputSchema.safeParse({ name: 'Jane' }).success).toBe(false);
    expect(subscriberInputSchema.safeParse({ email: 'jane@example.com' }).success).toBe(false);
  });

  it('rejects names shorter than 2 characters', () => {
    expect(subscriberInputSchema.safeParse({ name: 'J', email: 'j@e.com' }).success).toBe(false);
  });

  it('rejects whitespace-only names', () => {
    expect(
      subscriberInputSchema.safeParse({ name: '   ', email: 'jane@example.com' }).success,
    ).toBe(false);
  });

  it('rejects names containing digits or symbols', () => {
    expect(
      subscriberInputSchema.safeParse({ name: 'Jane123', email: 'jane@example.com' }).success,
    ).toBe(false);
    expect(
      subscriberInputSchema.safeParse({ name: 'Jane-Doe', email: 'jane@example.com' }).success,
    ).toBe(false);
  });

  it('rejects invalid email addresses', () => {
    expect(
      subscriberInputSchema.safeParse({ name: 'Jane Doe', email: 'not-an-email' }).success,
    ).toBe(false);
    expect(
      subscriberInputSchema.safeParse({ name: 'Jane Doe', email: 'jane@' }).success,
    ).toBe(false);
    expect(
      subscriberInputSchema.safeParse({ name: 'Jane Doe', email: 'jane @example.com' }).success,
    ).toBe(false);
  });

  it('rejects names longer than 100 characters', () => {
    expect(
      subscriberInputSchema.safeParse({ name: 'a'.repeat(101), email: 'jane@example.com' })
        .success,
    ).toBe(false);
  });
});
