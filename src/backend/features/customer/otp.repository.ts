import { getMongoConnection } from '@/backend/integrations/database/connection';
import OtpChallengeModel, {
  type IOtpChallenge,
} from '@/backend/integrations/database/models/OtpChallenge';

/**
 * Persistence for OTP challenges. All database access for this feature lives
 * here; the OTP service never touches Mongoose models directly.
 */

export interface OtpChallengeRecord {
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: string;
  lastSentAt: string;
}

type OtpChallengeDoc = IOtpChallenge & { _id: { toString(): string } };

function toRecord(doc: OtpChallengeDoc): OtpChallengeRecord {
  return {
    phone: doc.phone,
    codeHash: doc.codeHash,
    attempts: doc.attempts,
    expiresAt: doc.expiresAt.toISOString(),
    lastSentAt: doc.lastSentAt.toISOString(),
  };
}

export async function getOtpChallenge(phone: string): Promise<OtpChallengeRecord | null> {
  await getMongoConnection();
  const doc = await OtpChallengeModel.findOne({ phone });
  return doc ? toRecord(doc as OtpChallengeDoc) : null;
}

export async function upsertOtpChallenge(params: {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  lastSentAt: Date;
}): Promise<void> {
  await getMongoConnection();
  await OtpChallengeModel.findOneAndUpdate(
    { phone: params.phone },
    {
      $set: {
        codeHash: params.codeHash,
        attempts: 0,
        expiresAt: params.expiresAt,
        lastSentAt: params.lastSentAt,
      },
    },
    { upsert: true, runValidators: true, includeResultMetadata: true },
  );
}

export async function incrementOtpAttempts(phone: string): Promise<void> {
  await getMongoConnection();
  await OtpChallengeModel.updateOne({ phone }, { $inc: { attempts: 1 } });
}

export async function deleteOtpChallenge(phone: string): Promise<void> {
  await getMongoConnection();
  await OtpChallengeModel.deleteOne({ phone });
}
