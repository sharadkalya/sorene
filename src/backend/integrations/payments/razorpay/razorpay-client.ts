import { AppError } from '@/backend/errors';
import { getRazorpayKeyId, getRazorpayKeySecret } from '@/common/env';
import { RAZORPAY_PROVIDER_ID, type CreatePaymentOrderInput, type PaymentOrder, type PaymentProvider, type PaymentVerificationInput } from '../types';
import { verifyRazorpayPaymentSignature } from './razorpay-signature';

/**
 * Server-only Razorpay adapter. Talks to the REST API directly over `fetch`
 * (matching the WhatsApp integration) so no extra SDK dependency is needed.
 * Credentials come from `common/env.ts`; provider responses are normalized
 * into `AppError`s and never forwarded to clients.
 */

const RAZORPAY_API_HOST = 'https://api.razorpay.com';
const ORDERS_PATH = '/v1/orders';
const REQUEST_TIMEOUT_MS = 10_000;

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

interface RazorpayErrorBody {
  error?: { code?: string; description?: string };
}

interface RazorpayOrderResponse {
  id?: string;
  amount?: number;
  currency?: string;
}

function loadConfig(): RazorpayConfig {
  try {
    return { keyId: getRazorpayKeyId(), keySecret: getRazorpayKeySecret() };
  } catch (cause) {
    console.error('[razorpay] configuration error:', cause instanceof Error ? cause.message : cause);
    throw new AppError('SERVICE_UNAVAILABLE', 'Payment provider is not configured.', { cause });
  }
}

function authorizationHeader(config: RazorpayConfig): string {
  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;
}

function mapRazorpayError(httpStatus: number): AppError {
  if (httpStatus === 401 || httpStatus === 403) {
    return new AppError('UPSTREAM_ERROR', 'Payment provider rejected the server credentials.');
  }
  if (httpStatus === 429) {
    return new AppError('RATE_LIMITED', 'Payment provider rate limit reached. Please try again later.');
  }
  return new AppError('UPSTREAM_ERROR', 'Payment provider could not create the order.');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
  const config = loadConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${RAZORPAY_API_HOST}${ORDERS_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amountInPaise,
        currency: input.currency,
        receipt: input.receipt,
      }),
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
  } catch (cause) {
    const aborted = cause instanceof Error && cause.name === 'AbortError';
    console.error(`[razorpay] request ${aborted ? 'timed out' : 'failed'}`);
    throw aborted
      ? new AppError('UPSTREAM_TIMEOUT', 'Payment provider did not respond in time.', { cause })
      : new AppError('UPSTREAM_ERROR', 'Could not reach the payment provider.', { cause });
  } finally {
    clearTimeout(timer);
  }

  const body = (await readJson(response)) as RazorpayErrorBody & RazorpayOrderResponse | undefined;

  if (!response.ok) {
    console.error('[razorpay] create order failed', {
      httpStatus: response.status,
      code: body?.error?.code,
      detail: body?.error?.description,
    });
    throw mapRazorpayError(response.status);
  }

  if (typeof body?.id !== 'string' || body.id.length === 0) {
    console.error('[razorpay] unexpected success response without an order id');
    throw new AppError('UPSTREAM_ERROR', 'Payment provider returned an unexpected response.');
  }

  return {
    providerOrderId: body.id,
    amountInPaise: typeof body.amount === 'number' ? body.amount : input.amountInPaise,
    currency: typeof body.currency === 'string' ? body.currency : input.currency,
    publicKey: config.keyId,
  };
}

async function verifyPayment(input: PaymentVerificationInput): Promise<boolean> {
  const config = loadConfig();
  return verifyRazorpayPaymentSignature(
    input.providerOrderId,
    input.providerPaymentId,
    input.signature,
    config.keySecret,
  );
}

export const razorpayPaymentProvider: PaymentProvider = {
  id: RAZORPAY_PROVIDER_ID,
  createOrder,
  verifyPayment,
};
