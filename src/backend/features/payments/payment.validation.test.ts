import { describe, expect, it } from 'vitest';
import { paymentCreateSchema, paymentVerifySchema } from './payment.validation';

describe('paymentCreateSchema', () => {
  it('accepts a checkout input with address and items', () => {
    expect(
      paymentCreateSchema.safeParse({
        addressId: 'a1',
        items: [{ slug: 'the-arch-bag', quantity: 2 }],
      }).success,
    ).toBe(true);
  });

  it.each([
    {},
    { addressId: 'a1' },
    { addressId: 'a1', items: [] },
    { addressId: '', items: [{ slug: 's', quantity: 1 }] },
    { addressId: 'a1', items: [{ slug: 's', quantity: 0 }] },
    { addressId: 'a1', items: [{ slug: 's', quantity: 1.5 }] },
  ])('rejects %j', (input) => {
    expect(paymentCreateSchema.safeParse(input).success).toBe(false);
  });
});

describe('paymentVerifySchema', () => {
  const valid = {
    providerOrderId: 'order_abc',
    providerPaymentId: 'pay_abc',
    signature: 'a'.repeat(64),
  };

  it('accepts a valid verification payload', () => {
    expect(paymentVerifySchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    { ...valid, providerOrderId: '' },
    { ...valid, providerPaymentId: '' },
    { ...valid, signature: '' },
    { ...valid, providerOrderId: undefined },
    { ...valid, providerPaymentId: undefined },
    { ...valid, signature: undefined },
    {},
  ])('rejects %j', (input) => {
    expect(paymentVerifySchema.safeParse(input).success).toBe(false);
  });
});
