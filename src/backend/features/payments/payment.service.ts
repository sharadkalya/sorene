import { AppError } from '@/backend/errors';
import { getPaymentProvider } from '@/backend/integrations/payments';
import { getCustomerOrder, placeOrder, resolveOrderTotal } from '../orders/orders.service';
import * as paymentRepo from './payment.repository';
import type { PaymentCreateResult, PaymentVerifyResult } from './payment.types';
import { formatIssues, paymentCreateSchema, paymentVerifySchema } from './payment.validation';

const MIN_PAYMENT_AMOUNT_PAISE = 100;
const CURRENCY_INR = 'INR';

/** Unique provider receipt per attempt (Razorpay rejects duplicates). */
function buildReceipt(): string {
  return `pmt_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Create a payment order for the checkout input (address + items). The amount
 * is resolved server-side from the catalog; no internal order is created yet —
 * that happens only after the payment is verified.
 */
export async function createPaymentOrder(
  customerId: string,
  input: unknown,
): Promise<PaymentCreateResult> {
  const parsed = paymentCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  const total = await resolveOrderTotal(customerId, parsed.data);
  const amountInPaise = Math.round(total * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise < MIN_PAYMENT_AMOUNT_PAISE) {
    throw new AppError('VALIDATION_ERROR', 'Order total is too small to be paid online.');
  }

  const provider = getPaymentProvider();
  const paymentOrder = await provider.createOrder({
    amountInPaise,
    currency: CURRENCY_INR,
    receipt: buildReceipt(),
  });

  await paymentRepo.createPayment({
    provider: provider.id,
    providerOrderId: paymentOrder.providerOrderId,
    customerId,
    amountInPaise: paymentOrder.amountInPaise,
    currency: paymentOrder.currency,
    checkout: parsed.data,
  });

  return {
    provider: provider.id,
    providerOrderId: paymentOrder.providerOrderId,
    amountInPaise: paymentOrder.amountInPaise,
    currency: paymentOrder.currency,
    publicKey: paymentOrder.publicKey,
  };
}

/**
 * Verify the payment reported back by the checkout. On a valid signature the
 * internal order is placed (stock decremented) and the payment is marked paid;
 * on a mismatch the payment is marked failed and the order is never created.
 */
export async function verifyPayment(
  customerId: string,
  input: unknown,
): Promise<PaymentVerifyResult> {
  const parsed = paymentVerifySchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  const payment = await paymentRepo.getPaymentByProviderOrderId(parsed.data.providerOrderId);
  if (!payment || payment.customerId !== customerId) {
    throw new AppError('NOT_FOUND', 'Payment not found.');
  }

  // Idempotent: a repeated verification of an already-paid payment succeeds.
  if (payment.status === 'paid') {
    const order = payment.orderId ? await getCustomerOrder(customerId, payment.orderId) : null;
    return {
      verified: true,
      status: 'paid',
      orderId: payment.orderId ?? '',
      orderNumber: order?.number ?? '',
    };
  }

  const provider = getPaymentProvider();
  const verified = await provider.verifyPayment({
    providerOrderId: parsed.data.providerOrderId,
    providerPaymentId: parsed.data.providerPaymentId,
    signature: parsed.data.signature,
  });

  if (!verified) {
    await paymentRepo.markPaymentFailed(parsed.data.providerOrderId);
    throw new AppError('VALIDATION_ERROR', 'Payment verification failed.');
  }

  if (!payment.checkout) {
    await paymentRepo.markPaymentFailed(parsed.data.providerOrderId);
    throw new AppError('CONFLICT', 'Payment is missing checkout details.');
  }

  const order = await placeOrder(customerId, payment.checkout, {
    provider: payment.provider,
    providerPaymentId: parsed.data.providerPaymentId,
    amountInPaise: payment.amountInPaise,
    currency: payment.currency,
    paidAt: new Date().toISOString(),
  });

  // Null means a concurrent request already claimed it — still a success.
  await paymentRepo.markPaymentPaid(
    parsed.data.providerOrderId,
    parsed.data.providerPaymentId,
    order.id,
  );

  return { verified: true, status: 'paid', orderId: order.id, orderNumber: order.number };
}
