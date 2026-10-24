/**
 * Provider-agnostic payment contracts. A `PaymentProvider` is the only thing
 * the payments feature depends on, so swapping Razorpay for another gateway
 * (e.g. Stripe) means adding a new implementation — never touching services.
 */

export const RAZORPAY_PROVIDER_ID = 'razorpay';

export interface CreatePaymentOrderInput {
  /** Amount in the smallest currency unit (paise for INR). */
  amountInPaise: number;
  currency: string;
  /** Unique server-side reference (e.g. the internal order number). */
  receipt: string;
}

export interface PaymentOrder {
  providerOrderId: string;
  amountInPaise: number;
  currency: string;
  /** Public key the client needs to initialize the provider checkout. */
  publicKey: string;
}

export interface PaymentVerificationInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly id: string;
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder>;
  verifyPayment(input: PaymentVerificationInput): Promise<boolean>;
}
