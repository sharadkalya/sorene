import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/OtpChallenge', () => ({
  default: { findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import OtpChallengeModel from '@/backend/integrations/database/models/OtpChallenge';
import {
  deleteOtpChallenge,
  getOtpChallenge,
  incrementOtpAttempts,
  upsertOtpChallenge,
} from './otp.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findOneMock = vi.mocked(OtpChallengeModel.findOne);
const findOneAndUpdateMock = vi.mocked(OtpChallengeModel.findOneAndUpdate);
const updateOneMock = vi.mocked(OtpChallengeModel.updateOne);
const deleteOneMock = vi.mocked(OtpChallengeModel.deleteOne);

function fakeChallenge(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'o1' },
    phone: '+919876543210',
    codeHash: 'hash',
    attempts: 1,
    expiresAt: new Date('2026-01-01'),
    lastSentAt: new Date('2026-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getOtpChallenge', () => {
  it('connects and maps a challenge record', async () => {
    findOneMock.mockResolvedValue(fakeChallenge() as never);

    const result = await getOtpChallenge('+919876543210');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      phone: '+919876543210',
      codeHash: 'hash',
      attempts: 1,
      expiresAt: new Date('2026-01-01').toISOString(),
    });
  });

  it('returns null when no challenge exists', async () => {
    findOneMock.mockResolvedValue(null as never);
    await expect(getOtpChallenge('+919999999999')).resolves.toBeNull();
  });
});

describe('upsertOtpChallenge', () => {
  it('connects and atomically upserts, resetting attempts', async () => {
    findOneAndUpdateMock.mockResolvedValue({ value: fakeChallenge(), lastErrorObject: {} } as never);

    const expiresAt = new Date();
    const lastSentAt = new Date();
    await upsertOtpChallenge({ phone: '+919876543210', codeHash: 'hash', expiresAt, lastSentAt });

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { phone: '+919876543210' },
      { $set: { codeHash: 'hash', attempts: 0, expiresAt, lastSentAt } },
      expect.objectContaining({ upsert: true, includeResultMetadata: true }),
    );
  });
});

describe('incrementOtpAttempts / deleteOtpChallenge', () => {
  it('increments the attempt counter for the phone', async () => {
    updateOneMock.mockResolvedValue({ acknowledged: true } as never);

    await incrementOtpAttempts('+919876543210');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(updateOneMock).toHaveBeenCalledWith({ phone: '+919876543210' }, { $inc: { attempts: 1 } });
  });

  it('deletes the challenge for the phone', async () => {
    deleteOneMock.mockResolvedValue({ acknowledged: true } as never);

    await deleteOtpChallenge('+919876543210');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(deleteOneMock).toHaveBeenCalledWith({ phone: '+919876543210' });
  });
});
