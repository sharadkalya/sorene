import { AppError } from '@/backend/errors';
import { sendStayTunedEmail } from '@/backend/integrations/email/email-client';
import { listSubscribers, upsertSubscriber } from './subscriber.repository';
import { formatIssues, subscriberInputSchema } from './subscriber.validation';

const DISCOUNT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface RegisterInterestResult {
  created: boolean;
  message: string;
}

/**
 * Register (or re-register) interest from the stay-tuned form.
 *
 * Email is a best-effort notification: the subscriber is persisted first, so a
 * delivery failure is logged but does not fail the request (retrying would
 * otherwise double-count interest).
 */
export async function registerInterest(input: unknown): Promise<RegisterInterestResult> {
  const parsed = subscriberInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  const { name, email } = parsed.data;
  const discountCode = generateDiscountCode();
  const { created } = await upsertSubscriber({ name, email, discountCode });

  try {
    await sendStayTunedEmail({ name, email, discountCode });
  } catch (error) {
    console.error('Failed to send stay-tuned email', { email, error });
  }

  return {
    created,
    message: 'Thank you for your interest! Check your email for your exclusive discount code.',
  };
}

export async function getSubscribers() {
  return listSubscribers();
}

function generateDiscountCode(): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += DISCOUNT_ALPHABET[Math.floor(Math.random() * DISCOUNT_ALPHABET.length)];
  }
  return `SORVENE-${suffix}`;
}
