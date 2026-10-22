import { z } from 'zod';

/** E.164 without the leading `+`: country code (no leading zero) + subscriber, 8–15 digits. */
const E164_DIGITS = /^[1-9]\d{7,14}$/;

const RECIPIENT_ERROR =
  'Provide the recipient number in international format with country code, e.g. 919876543210.';

/**
 * Normalize a user-supplied phone number to digits-only international format.
 * Accepts an optional leading `+` or `00` and common separators (space, `-`, `.`, parentheses).
 * Returns an empty string for anything else so validation rejects it.
 */
export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) {
    return '';
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.startsWith('00') ? digits.slice(2) : digits;
}

export const recipientSchema = z
  .string({ error: RECIPIENT_ERROR })
  .transform(normalizePhoneNumber)
  .refine((value) => E164_DIGITS.test(value), { message: RECIPIENT_ERROR });

export const testNotificationQuerySchema = z.object({ to: recipientSchema });

/** Hide all but the last 4 digits for server-side logs. */
export function maskPhoneNumber(phone: string): string {
  return phone.length <= 4 ? '****' : `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export const webhookVerificationSchema = z.object({
  mode: z.literal('subscribe'),
  token: z.string().min(1),
  challenge: z.string().regex(/^[A-Za-z0-9_-]{1,256}$/),
});

const webhookStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  timestamp: z.string().optional(),
  recipient_id: z.string().optional(),
  errors: z
    .array(z.object({ code: z.number().optional(), title: z.string().optional() }))
    .optional(),
});

export const webhookPayloadSchema = z.object({
  object: z.string(),
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              value: z.object({ statuses: z.array(webhookStatusSchema).optional() }).optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
