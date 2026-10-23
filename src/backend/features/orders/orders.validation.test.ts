import { describe, expect, it } from 'vitest';
import { orderCreateSchema } from './orders.validation';

describe('orders validation', () => {
  it('accepts a valid order', () => {
    const result = orderCreateSchema.safeParse({
      addressId: 'a1',
      items: [{ slug: 'the-arch-bag', quantity: 2 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].quantity).toBe(2);
    }
  });

  it('rejects an empty items array', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing addressId', () => {
    const result = orderCreateSchema.safeParse({ items: [{ slug: 's', quantity: 1 }] });
    expect(result.success).toBe(false);
  });

  it('rejects an empty slug', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [{ slug: '', quantity: 1 }] });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [{ slug: 's', quantity: 0 }] });
    expect(result.success).toBe(false);
  });

  it('rejects a negative quantity', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [{ slug: 's', quantity: -2 }] });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [{ slug: 's', quantity: 1.5 }] });
    expect(result.success).toBe(false);
  });

  it('rejects a quantity above 99', () => {
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items: [{ slug: 's', quantity: 100 }] });
    expect(result.success).toBe(false);
  });

  it('coerces a numeric string quantity', () => {
    const result = orderCreateSchema.safeParse({
      addressId: 'a1',
      items: [{ slug: 's', quantity: '3' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].quantity).toBe(3);
    }
  });

  it('rejects more than 100 line items', () => {
    const items = Array.from({ length: 101 }, (_, index) => ({ slug: `s${index}`, quantity: 1 }));
    const result = orderCreateSchema.safeParse({ addressId: 'a1', items });
    expect(result.success).toBe(false);
  });
});
