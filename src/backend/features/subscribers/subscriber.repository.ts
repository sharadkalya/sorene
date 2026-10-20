import { getMongoConnection } from '@/backend/integrations/database/connection';
import SubscriberModel, { ISubscriber } from '@/backend/integrations/database/models/Subscriber';
import type { SubscriberRecord } from './subscriber.types';

/**
 * Persistence for subscribers. All database access for this feature lives here;
 * services and route handlers never touch Mongoose models directly.
 */

export interface UpsertSubscriberParams {
  name: string;
  email: string;
  discountCode: string;
}

type SubscriberDoc = ISubscriber & {
  _id: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
};

function toRecord(doc: SubscriberDoc): SubscriberRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    discountCode: doc.discountCode,
    count: doc.count,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

/** Create a subscriber, or increment the interest count for an existing one. */
export async function upsertSubscriber(
  params: UpsertSubscriberParams,
): Promise<{ subscriber: SubscriberRecord; created: boolean }> {
  await getMongoConnection();

  // Atomic upsert: findOne+create would race two concurrent first-time
  // submissions for the same email into a duplicate-key error.
  const result = await SubscriberModel.findOneAndUpdate(
    { email: params.email },
    { $set: { name: params.name, discountCode: params.discountCode }, $inc: { count: 1 } },
    { new: true, upsert: true, runValidators: true, includeResultMetadata: true },
  );

  const doc = result.value as SubscriberDoc;
  const created = Boolean((result.lastErrorObject as { upserted?: unknown } | undefined)?.upserted);
  return { subscriber: toRecord(doc), created };
}

/** All subscribers, newest first. */
export async function listSubscribers(): Promise<SubscriberRecord[]> {
  await getMongoConnection();
  const docs = await SubscriberModel.find({}).sort({ createdAt: -1 }).exec();
  return docs.map((doc) => toRecord(doc));
}
