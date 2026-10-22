import { AppError } from '@/backend/errors';
import { getCustomerSessionSecret } from '@/common/env';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from '@/backend/auth/otp';
import { sendWhatsAppMessage } from '@/backend/integrations/whatsapp/whatsapp-client';
import { upsertCustomerByPhone } from './customer.repository';
import type { CustomerRecord } from './customer.types';
import {
  deleteOtpChallenge,
  getOtpChallenge,
  incrementOtpAttempts,
  upsertOtpChallenge,
} from './otp.repository';
import { formatIssues, otpRequestSchema, otpVerifySchema } from './otp.validation';

/**
 * WhatsApp-delivered OTP sign-in.
 *
 * The code is generated here, stored only as an HMAC hash, and delivered via a
 * Meta `authentication` template (never a marketing/utility template). Edge
 * cases controlled: one active code per phone, 5-minute TTL, 30s resend
 * cooldown, 5 verify attempts, constant-time comparison, and one-time use.
 */

export const OTP_TEMPLATE_NAME = 'sorveneotp';
const OTP_TEMPLATE_LANGUAGE = 'en';
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

export interface RequestOtpResult {
  retryAfterSeconds: number;
  expiresInSeconds: number;
}

export async function requestOtp(input: unknown): Promise<RequestOtpResult> {
  const parsed = otpRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  const phone = parsed.data.phone;

  const existing = await getOtpChallenge(phone);
  if (existing) {
    const retryAfterSeconds = Math.ceil(
      (new Date(existing.lastSentAt).getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000,
    );
    if (retryAfterSeconds > 0) {
      throw new AppError(
        'RATE_LIMITED',
        `A code was recently sent. Please wait ${retryAfterSeconds} seconds before requesting another.`,
      );
    }
  }

  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await upsertOtpChallenge({
    phone,
    codeHash: hashOtpCode(getCustomerSessionSecret(), phone, code),
    expiresAt,
    lastSentAt: now,
  });

  try {
    await sendWhatsAppMessage(phone, {
      type: 'template',
      name: OTP_TEMPLATE_NAME,
      languageCode: OTP_TEMPLATE_LANGUAGE,
      parameters: [code],
    });
  } catch (error) {
    // Sending failed, so the stored code is useless — clear it and let a retry
    // start clean instead of being blocked by the cooldown.
    await deleteOtpChallenge(phone);
    throw error;
  }

  return {
    retryAfterSeconds: RESEND_COOLDOWN_MS / 1000,
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
}

export async function verifyOtp(input: unknown): Promise<CustomerRecord> {
  const parsed = otpVerifySchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  const { phone, code } = parsed.data;

  const challenge = await getOtpChallenge(phone);
  if (!challenge || new Date(challenge.expiresAt).getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'That code has expired. Please request a new one.');
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await deleteOtpChallenge(phone);
    throw new AppError('UNAUTHORIZED', 'Too many incorrect attempts. Please request a new code.');
  }

  if (!verifyOtpCode(getCustomerSessionSecret(), phone, code, challenge.codeHash)) {
    await incrementOtpAttempts(phone);
    const remaining = MAX_ATTEMPTS - challenge.attempts - 1;
    throw new AppError(
      'UNAUTHORIZED',
      remaining > 0
        ? `That code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'That code is incorrect. Please request a new one.',
    );
  }

  await deleteOtpChallenge(phone);
  return upsertCustomerByPhone(phone);
}
