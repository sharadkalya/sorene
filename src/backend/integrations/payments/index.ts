import { AppError } from '@/backend/errors';
import { getPaymentProviderId } from '@/common/env';
import { razorpayPaymentProvider } from './razorpay/razorpay-client';
import type { PaymentProvider } from './types';

/**
 * Registry of available payment providers keyed by their id. Adding a new
 * provider (e.g. Stripe) only requires an implementation here — the payments
 * feature and route handlers stay untouched.
 */
const PROVIDERS: Record<string, PaymentProvider> = {
  [razorpayPaymentProvider.id]: razorpayPaymentProvider,
};

/** Resolve the active provider from `PAYMENT_PROVIDER` (fails closed). */
export function getPaymentProvider(): PaymentProvider {
  const id = getPaymentProviderId();
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new AppError('SERVICE_UNAVAILABLE', `Unknown payment provider: ${id}`);
  }
  return provider;
}
