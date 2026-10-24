import { getMongoConnection } from '@/backend/integrations/database/connection';
import PaymentModel from '@/backend/integrations/database/models/Payment';
import type { PaymentCheckoutRecord, PaymentRecord } from './payment.types';

/**
 * Persistence for the payments feature. Every function awaits the shared
 * Mongoose connection before touching the model.
 */

export interface CreatePaymentData {
  provider: string;
  providerOrderId: string;
  customerId: string;
  amountInPaise: number;
  currency: string;
  checkout: PaymentCheckoutRecord;
}

type PaymentDoc = {
  _id: { toString(): string };
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  orderId?: { toString(): string };
  customerId: { toString(): string };
  amountInPaise: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  checkout?: PaymentCheckoutRecord;
  createdAt?: Date;
  updatedAt?: Date;
};

function toPaymentRecord(doc: PaymentDoc): PaymentRecord {
  return {
    id: doc._id.toString(),
    provider: doc.provider,
    providerOrderId: doc.providerOrderId,
    providerPaymentId: doc.providerPaymentId,
    orderId: doc.orderId?.toString(),
    customerId: doc.customerId?.toString() ?? '',
    amountInPaise: doc.amountInPaise,
    currency: doc.currency,
    status: doc.status,
    checkout: doc.checkout,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

export async function createPayment(data: CreatePaymentData): Promise<PaymentRecord> {
  await getMongoConnection();
  const doc = await PaymentModel.create({ ...data, status: 'created' });
  return toPaymentRecord(doc as unknown as PaymentDoc);
}

export async function getPaymentByProviderOrderId(
  providerOrderId: string,
): Promise<PaymentRecord | null> {
  await getMongoConnection();
  const doc = await PaymentModel.findOne({ providerOrderId }).exec();
  return doc ? toPaymentRecord(doc as unknown as PaymentDoc) : null;
}

/**
 * Mark a created payment as paid and link it to the internal order. The
 * `status: 'created'` guard makes this idempotent — a concurrent duplicate
 * verification returns null instead of double-writing.
 */
export async function markPaymentPaid(
  providerOrderId: string,
  providerPaymentId: string,
  orderId: string,
): Promise<PaymentRecord | null> {
  await getMongoConnection();
  const doc = await PaymentModel.findOneAndUpdate(
    { providerOrderId, status: 'created' },
    { $set: { providerPaymentId, status: 'paid', orderId } },
    { new: true },
  ).exec();
  return doc ? toPaymentRecord(doc as unknown as PaymentDoc) : null;
}

/** Mark a created payment as failed (signature mismatch or verification error). */
export async function markPaymentFailed(providerOrderId: string): Promise<PaymentRecord | null> {
  await getMongoConnection();
  const doc = await PaymentModel.findOneAndUpdate(
    { providerOrderId, status: 'created' },
    { $set: { status: 'failed' } },
    { new: true },
  ).exec();
  return doc ? toPaymentRecord(doc as unknown as PaymentDoc) : null;
}
