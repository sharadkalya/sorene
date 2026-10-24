import { z } from 'zod';
import { formatIssues, orderCreateSchema } from '../orders/orders.validation';

/**
 * Create a payment for the items/address the customer wants to order. The
 * amount is always derived server-side from the catalog — never trusted from
 * the client. Mirrors the order-create schema so the two never drift.
 */
export const paymentCreateSchema = orderCreateSchema;

export { formatIssues };

/**
 * Verify a provider payment reported back by the checkout. The ids/signature
 * are provider-agnostic; the client maps Razorpay's `razorpay_order_id`,
 * `razorpay_payment_id`, and `razorpay_signature` onto these fields.
 */
export const paymentVerifySchema = z.object({
  providerOrderId: z.string().trim().min(1, 'Payment order is required'),
  providerPaymentId: z.string().trim().min(1, 'Payment id is required'),
  signature: z.string().trim().min(1, 'Payment signature is required'),
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentVerifyInput = z.infer<typeof paymentVerifySchema>;
