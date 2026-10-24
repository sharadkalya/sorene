/** API response contracts for the payments feature. */

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface PaymentCheckoutRecord {
  addressId: string;
  items: { slug: string; quantity: number }[];
}

export interface PaymentRecord {
  id: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  orderId?: string;
  customerId: string;
  amountInPaise: number;
  currency: string;
  status: PaymentStatus;
  checkout?: PaymentCheckoutRecord;
  createdAt: string;
  updatedAt: string;
}

/** Returned by `POST /api/payments/create-order` and consumed by checkout UI. */
export interface PaymentCreateResult {
  provider: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: string;
  publicKey: string;
}

/** Returned by `POST /api/payments/verify`. */
export interface PaymentVerifyResult {
  verified: boolean;
  status: PaymentStatus;
  orderId: string;
  orderNumber: string;
}
