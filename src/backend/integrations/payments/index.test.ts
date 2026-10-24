import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentProvider } from './index';
import { razorpayPaymentProvider } from './razorpay/razorpay-client';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.PAYMENT_PROVIDER;
  vi.restoreAllMocks();
});

describe('getPaymentProvider', () => {
  it('returns the razorpay provider by default', () => {
    expect(getPaymentProvider()).toBe(razorpayPaymentProvider);
  });

  it('returns the razorpay provider when PAYMENT_PROVIDER=razorpay', () => {
    process.env.PAYMENT_PROVIDER = 'razorpay';
    expect(getPaymentProvider()).toBe(razorpayPaymentProvider);
  });

  it('fails closed for an unknown provider', () => {
    process.env.PAYMENT_PROVIDER = 'stripe';
    expect(() => getPaymentProvider()).toThrowError(expect.objectContaining({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
    }));
  });
});
