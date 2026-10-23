import {
  getWhatsAppAccessToken,
  getWhatsAppApiVersion,
  getWhatsAppPhoneNumberId,
} from '@/common/env';
import { AppError } from '@/backend/errors';

/**
 * Server-only adapter for the Meta WhatsApp Cloud API (Graph API).
 *
 * The endpoint host is fixed here and the path is built only from validated
 * environment configuration, so callers can never influence the request URL,
 * credentials, or sender ID. Provider responses are normalized into `AppError`s
 * and never forwarded to clients.
 */

const GRAPH_API_HOST = 'https://graph.facebook.com';
const REQUEST_TIMEOUT_MS = 10_000;

export type WhatsAppOutboundMessage =
  | { type: 'text'; body: string }
  | {
      type: 'template';
      name: string;
      languageCode: string;
      parameters?: string[];
      copyCode?: string;
    };

export interface WhatsAppSendResult {
  messageId: string;
  recipientWaId?: string;
}

interface GraphErrorBody {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}

function loadConfig(): WhatsAppConfig {
  try {
    return {
      accessToken: getWhatsAppAccessToken(),
      phoneNumberId: getWhatsAppPhoneNumberId(),
      apiVersion: getWhatsAppApiVersion(),
    };
  } catch (cause) {
    console.error('[whatsapp] configuration error:', cause instanceof Error ? cause.message : cause);
    throw new AppError('SERVICE_UNAVAILABLE', 'WhatsApp integration is not configured.', { cause });
  }
}

function buildPayload(to: string, message: WhatsAppOutboundMessage): Record<string, unknown> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  if (message.type === 'text') {
    return { ...base, type: 'text', text: { preview_url: false, body: message.body } };
  }
  const template: Record<string, unknown> = {
    name: message.name,
    language: { code: message.languageCode },
  };
  const components: Record<string, unknown>[] = [];
  if (message.parameters && message.parameters.length > 0) {
    components.push({
      type: 'body',
      parameters: message.parameters.map((text) => ({ type: 'text', text })),
    });
  }
  if (message.copyCode) {
    // Authentication templates carry a "Copy code" button whose URL also uses
    // the OTP variable — omitting this parameter fails with error 131008.
    components.push({
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: message.copyCode }],
    });
  }
  if (components.length > 0) {
    template.components = components;
  }
  return { ...base, type: 'template', template };
}

// Meta error codes: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
const RATE_LIMIT_CODES = new Set([4, 80007, 130429, 131048, 131056]);
const AUTH_CODES = new Set([0, 10, 190, 200]);
const TEMPLATE_CODES = new Set([132000, 132001, 132005, 132007, 132012]);

function mapGraphError(httpStatus: number, error: GraphErrorBody | undefined): AppError {
  const code = error?.code;

  if (httpStatus === 429 || (code !== undefined && RATE_LIMIT_CODES.has(code))) {
    return new AppError('RATE_LIMITED', 'WhatsApp rate limit reached. Please try again later.');
  }
  if (code === 131030) {
    return new AppError(
      'VALIDATION_ERROR',
      'Recipient is not on the allowed list for this WhatsApp test number. Add it as a recipient in the Meta developer dashboard (WhatsApp > API Setup) and verify it.',
    );
  }
  if (code === 131026 || code === 131021) {
    return new AppError(
      'VALIDATION_ERROR',
      'Recipient cannot receive WhatsApp messages (not a WhatsApp user or invalid number).',
    );
  }
  if (httpStatus === 401 || httpStatus === 403 || (code !== undefined && AUTH_CODES.has(code))) {
    return new AppError(
      'UPSTREAM_ERROR',
      'WhatsApp rejected the server credentials. The access token is invalid or expired — regenerate it in the Meta developer dashboard.',
    );
  }
  if (code !== undefined && TEMPLATE_CODES.has(code)) {
    return new AppError('UPSTREAM_ERROR', 'The WhatsApp message template is unavailable or invalid.');
  }
  return new AppError('UPSTREAM_ERROR', 'WhatsApp could not send the message.');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Send one message through the configured WhatsApp sender number. */
export async function sendWhatsAppMessage(
  to: string,
  message: WhatsAppOutboundMessage,
): Promise<WhatsAppSendResult> {
  const config = loadConfig();
  const url = `${GRAPH_API_HOST}/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(to, message)),
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
  } catch (cause) {
    const aborted = cause instanceof Error && cause.name === 'AbortError';
    console.error(`[whatsapp] request ${aborted ? 'timed out' : 'failed'}`);
    throw aborted
      ? new AppError('UPSTREAM_TIMEOUT', 'WhatsApp did not respond in time.', { cause })
      : new AppError('UPSTREAM_ERROR', 'Could not reach WhatsApp.', { cause });
  } finally {
    clearTimeout(timer);
  }

  const body = (await readJson(response)) as
    | { error?: GraphErrorBody; messages?: { id?: string }[]; contacts?: { wa_id?: string }[] }
    | undefined;

  if (!response.ok) {
    const graphError = body?.error;
    console.error('[whatsapp] send failed', {
      httpStatus: response.status,
      code: graphError?.code,
      subcode: graphError?.error_subcode,
      type: graphError?.type,
      detail: graphError?.message,
      fbtraceId: graphError?.fbtrace_id,
    });
    throw mapGraphError(response.status, graphError);
  }

  const messageId = body?.messages?.[0]?.id;
  if (!messageId) {
    console.error('[whatsapp] unexpected success response without a message id');
    throw new AppError('UPSTREAM_ERROR', 'WhatsApp returned an unexpected response.');
  }

  return { messageId, recipientWaId: body?.contacts?.[0]?.wa_id };
}
