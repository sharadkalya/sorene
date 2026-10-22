import { getWhatsAppAppSecret, getWhatsAppVerifyToken } from '@/common/env';
import { AppError } from '@/backend/errors';
import { rateLimit } from '@/backend/auth/rate-limit';
import { sendWhatsAppMessage } from '@/backend/integrations/whatsapp/whatsapp-client';
import {
  safeEqual,
  verifyWebhookSignature,
} from '@/backend/integrations/whatsapp/whatsapp-signature';
import type { TestNotificationResult, WebhookStatusUpdate } from './whatsapp.types';
import {
  formatIssues,
  maskPhoneNumber,
  testNotificationQuerySchema,
  webhookPayloadSchema,
  webhookVerificationSchema,
} from './whatsapp.validation';

/**
 * Meta's sandbox template, pre-approved on every WhatsApp Cloud API app. Free-form text can only
 * be sent inside a 24h customer-service window, which a fresh test recipient never has, so a
 * template is the only message that reliably opens a conversation.
 */
export const TEST_TEMPLATE_NAME = 'hello_world';
export const TEST_TEMPLATE_LANGUAGE = 'en_US';

const TEST_GLOBAL_LIMIT = { limit: 5, windowMs: 60_000 };
const TEST_RECIPIENT_LIMIT = { limit: 3, windowMs: 10 * 60_000 };
const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

/**
 * Send the approved `hello_world` template to a recipient. Callers must already be authorized.
 * Validates/normalizes the number and throttles both overall volume and repeats to one number.
 */
export async function sendTestNotification(rawTo: unknown): Promise<TestNotificationResult> {
  const parsed = testNotificationQuerySchema.safeParse({ to: rawTo });
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  const to = parsed.data.to;

  if (
    rateLimit('whatsapp:test:global', TEST_GLOBAL_LIMIT).limited ||
    rateLimit(`whatsapp:test:to:${to}`, TEST_RECIPIENT_LIMIT).limited
  ) {
    throw new AppError('RATE_LIMITED', 'Too many WhatsApp test messages. Please try again later.');
  }

  const result = await sendWhatsAppMessage(to, {
    type: 'template',
    name: TEST_TEMPLATE_NAME,
    languageCode: TEST_TEMPLATE_LANGUAGE,
  });

  console.info('[whatsapp] test notification accepted', {
    to: maskPhoneNumber(to),
    messageId: result.messageId,
  });

  return {
    status: 'accepted',
    messageId: result.messageId,
    template: TEST_TEMPLATE_NAME,
    recipient: maskPhoneNumber(to),
  };
}

/** Answer Meta's webhook subscription handshake. Returns the challenge to echo back. */
export function verifyWebhookSubscription(params: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
}): string {
  let expectedToken: string;
  try {
    expectedToken = getWhatsAppVerifyToken();
  } catch (cause) {
    throw new AppError('SERVICE_UNAVAILABLE', 'WhatsApp webhook is not configured.', { cause });
  }

  const parsed = webhookVerificationSchema.safeParse(params);
  if (!parsed.success || !safeEqual(parsed.data.token, expectedToken)) {
    throw new AppError('FORBIDDEN', 'Webhook verification failed.');
  }
  return parsed.data.challenge;
}

/**
 * Authenticate (X-Hub-Signature-256 over the raw body) and process a Meta webhook delivery.
 * Message-status updates are logged with masked recipients; nothing is persisted because the
 * application has no messaging model yet.
 */
export function handleWebhookEvent(
  rawBody: Buffer,
  signatureHeader: string | null,
): WebhookStatusUpdate[] {
  let appSecret: string;
  try {
    appSecret = getWhatsAppAppSecret();
  } catch (cause) {
    throw new AppError('SERVICE_UNAVAILABLE', 'WhatsApp webhook is not configured.', { cause });
  }

  if (rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Webhook payload is too large.');
  }
  if (!verifyWebhookSignature(rawBody, signatureHeader, appSecret)) {
    throw new AppError('UNAUTHORIZED', 'Invalid webhook signature.');
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Webhook payload is not valid JSON.');
  }

  const parsed = webhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Unsupported webhook payload.');
  }

  const updates: WebhookStatusUpdate[] = [];
  for (const entry of parsed.data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        updates.push({
          messageId: status.id,
          status: status.status,
          recipient: status.recipient_id ? maskPhoneNumber(status.recipient_id) : undefined,
          errorCodes: (status.errors ?? []).flatMap((e) => (e.code === undefined ? [] : [e.code])),
        });
      }
    }
  }

  for (const update of updates) {
    console.info('[whatsapp] message status', update);
  }
  return updates;
}
