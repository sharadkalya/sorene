import mongoose from 'mongoose';

export interface IOtpChallenge {
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  lastSentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OtpChallengeSchema = new mongoose.Schema<IOtpChallenge>(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// One active challenge per phone; expired challenges are auto-purged.
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpChallenge ||
  mongoose.model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);
