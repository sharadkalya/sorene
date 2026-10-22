import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common/env', () => ({
  getCustomerSessionSecret: () => 'test-secret',
}));

vi.mock('@/backend/auth/otp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/backend/auth/otp')>();
  return { ...actual, generateOtpCode: vi.fn() };
});

vi.mock('@/backend/integrations/whatsapp/whatsapp-client', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock('./otp.repository', () => ({
  getOtpChallenge: vi.fn(),
  upsertOtpChallenge: vi.fn(),
  incrementOtpAttempts: vi.fn(),
  deleteOtpChallenge: vi.fn(),
}));

vi.mock('./customer.repository', () => ({
  upsertCustomerByPhone: vi.fn(),
}));

import { generateOtpCode, hashOtpCode } from '@/backend/auth/otp';
import { sendWhatsAppMessage } from '@/backend/integrations/whatsapp/whatsapp-client';
import { upsertCustomerByPhone } from './customer.repository';
import {
  deleteOtpChallenge,
  getOtpChallenge,
  incrementOtpAttempts,
  upsertOtpChallenge,
} from './otp.repository';
import { requestOtp, verifyOtp } from './otp.service';

const generateOtpCodeMock = vi.mocked(generateOtpCode);
const sendWhatsAppMessageMock = vi.mocked(sendWhatsAppMessage);
const getOtpChallengeMock = vi.mocked(getOtpChallenge);
const upsertOtpChallengeMock = vi.mocked(upsertOtpChallenge);
const incrementOtpAttemptsMock = vi.mocked(incrementOtpAttempts);
const deleteOtpChallengeMock = vi.mocked(deleteOtpChallenge);
const upsertCustomerByPhoneMock = vi.mocked(upsertCustomerByPhone);

const PHONE = '+919876543210';

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    phone: PHONE,
    codeHash: hashOtpCode('test-secret', PHONE, '123456'),
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    lastSentAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  generateOtpCodeMock.mockReturnValue('123456');
  upsertOtpChallengeMock.mockResolvedValue(undefined);
  sendWhatsAppMessageMock.mockResolvedValue({ messageId: 'wamid.OTP' });
});

describe('requestOtp', () => {
  it('rejects invalid input without sending', async () => {
    await expect(requestOtp({ phone: 'not-a-phone' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
  });

  it('stores the hashed code and sends it via the authentication template', async () => {
    getOtpChallengeMock.mockResolvedValue(null);

    const result = await requestOtp({ phone: PHONE });

    expect(sendWhatsAppMessageMock).toHaveBeenCalledWith(PHONE, {
      type: 'template',
      name: 'sorveneotp',
      languageCode: 'en',
      parameters: ['123456'],
    });
    expect(upsertOtpChallengeMock).toHaveBeenCalledWith({
      phone: PHONE,
      codeHash: hashOtpCode('test-secret', PHONE, '123456'),
      expiresAt: expect.any(Date),
      lastSentAt: expect.any(Date),
    });
    expect(result).toEqual({ retryAfterSeconds: 30, expiresInSeconds: 300 });
  });

  it('enforces the resend cooldown without sending', async () => {
    getOtpChallengeMock.mockResolvedValue(challenge({ lastSentAt: new Date().toISOString() }));

    await expect(requestOtp({ phone: PHONE })).rejects.toMatchObject({
      name: 'AppError',
      code: 'RATE_LIMITED',
    });
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
  });

  it('clears the stored code when the WhatsApp send fails', async () => {
    getOtpChallengeMock.mockResolvedValue(null);
    sendWhatsAppMessageMock.mockRejectedValue(new Error('provider down'));

    await expect(requestOtp({ phone: PHONE })).rejects.toThrow('provider down');
    expect(deleteOtpChallengeMock).toHaveBeenCalledWith(PHONE);
  });
});

describe('verifyOtp', () => {
  it('rejects invalid input', async () => {
    await expect(verifyOtp({ phone: PHONE, code: '12' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when no challenge exists', async () => {
    getOtpChallengeMock.mockResolvedValue(null);
    await expect(verifyOtp({ phone: PHONE, code: '123456' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
    });
  });

  it('rejects an expired challenge', async () => {
    getOtpChallengeMock.mockResolvedValue(
      challenge({ expiresAt: new Date(Date.now() - 1000).toISOString() }),
    );
    await expect(verifyOtp({ phone: PHONE, code: '123456' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
    });
  });

  it('increments attempts on a wrong code', async () => {
    getOtpChallengeMock.mockResolvedValue(
      challenge({ codeHash: hashOtpCode('test-secret', PHONE, '999999') }),
    );

    await expect(verifyOtp({ phone: PHONE, code: '123456' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
    });
    expect(incrementOtpAttemptsMock).toHaveBeenCalledWith(PHONE);
    expect(upsertCustomerByPhoneMock).not.toHaveBeenCalled();
  });

  it('deletes the challenge after too many attempts', async () => {
    getOtpChallengeMock.mockResolvedValue(challenge({ attempts: 5 }));

    await expect(verifyOtp({ phone: PHONE, code: '123456' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
    });
    expect(deleteOtpChallengeMock).toHaveBeenCalledWith(PHONE);
  });

  it('consumes the code and returns the customer on success', async () => {
    getOtpChallengeMock.mockResolvedValue(challenge());
    upsertCustomerByPhoneMock.mockResolvedValue({
      id: 'c1',
      phone: PHONE,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await verifyOtp({ phone: PHONE, code: '123456' });

    expect(result.id).toBe('c1');
    expect(deleteOtpChallengeMock).toHaveBeenCalledWith(PHONE);
    expect(upsertCustomerByPhoneMock).toHaveBeenCalledWith(PHONE);
  });
});
