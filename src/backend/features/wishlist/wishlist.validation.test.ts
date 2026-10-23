import { describe, expect, it } from 'vitest';
import { wishlistAddSchema } from './wishlist.validation';

describe('wishlistAddSchema', () => {
  it('accepts a valid slug', () => {
    const result = wishlistAddSchema.safeParse({ slug: 'structured-leather-tote' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('structured-leather-tote');
    }
  });

  it('trims the slug', () => {
    const result = wishlistAddSchema.safeParse({ slug: '  tote  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('tote');
    }
  });

  it('rejects an empty slug', () => {
    expect(wishlistAddSchema.safeParse({ slug: '' }).success).toBe(false);
  });

  it('rejects a missing slug', () => {
    expect(wishlistAddSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an over-long slug', () => {
    expect(wishlistAddSchema.safeParse({ slug: 'a'.repeat(161) }).success).toBe(false);
  });
});
