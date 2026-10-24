import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/backend/errors';
import { razorpayPaymentProvider } from './razorpay-client';

const KEY_ID = 'rzp_test_TestKey';
const KEY_SECRET = 'test-secret-value';
const ORDER_ID = 'order_JK8Qn0nR6v2xNd';
const AUTH_HEADER = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

const fetchMock = vi.fn();

function razorpayResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function catchError(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error('Expected the promise to reject');
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.RAZORPAY_KEY_ID = KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.PAYMENT_PROVIDER;
});

describe('razorpayPaymentProvider.createOrder', () => {
  const input = { amountInPaise: 48000, currency: 'INR', receipt: 'SR-20261023-1234' };

  it('posts the order with Basic auth and returns the provider order', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(200, { id: ORDER_ID, amount: 48000, currency: 'INR' }));

    const result = await razorpayPaymentProvider.createOrder(input);

    expect(result).toEqual({
      providerOrderId: ORDER_ID,
      amountInPaise: 48000,
      currency: 'INR',
      publicKey: KEY_ID,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.razorpay.com/v1/orders');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(AUTH_HEADER);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      amount: 48000,
      currency: 'INR',
      receipt: 'SR-20261023-1234',
    });
  });

  it('falls back to the request values when the provider omits amount/currency', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(200, { id: ORDER_ID }));

    const result = await razorpayPaymentProvider.createOrder(input);

    expect(result.amountInPaise).toBe(48000);
    expect(result.currency).toBe('INR');
  });

  it('maps a 401 credential failure to UPSTREAM_ERROR', async () => {
    fetchMock.mockResolvedValue(
      razorpayResponse(401, { error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid key' } }),
    );

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('UPSTREAM_ERROR');
    expect(error.status).toBe(502);
  });

  it('maps a 403 credential failure to UPSTREAM_ERROR', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(403, { error: { code: 'FORBIDDEN' } }));

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('UPSTREAM_ERROR');
  });

  it('maps a 429 response to RATE_LIMITED', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(429, {}));

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.status).toBe(429);
  });

  it('maps other non-2xx responses to UPSTREAM_ERROR', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(500, { error: { code: 'INTERNAL' } }));

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('UPSTREAM_ERROR');
    expect(error.status).toBe(502);
  });

  it('maps a network failure to UPSTREAM_ERROR', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('UPSTREAM_ERROR');
  });

  it('maps a request timeout to UPSTREAM_TIMEOUT', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        }),
    );

    const pending = razorpayPaymentProvider.createOrder(input);
    const assertion = expect(pending).rejects.toMatchObject({ code: 'UPSTREAM_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
  });

  it('maps an unexpected success response (no id) to UPSTREAM_ERROR', async () => {
    fetchMock.mockResolvedValue(razorpayResponse(200, { amount: 48000 }));

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('UPSTREAM_ERROR');
  });

  it('fails closed with SERVICE_UNAVAILABLE when credentials are missing', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const error = await catchError(razorpayPaymentProvider.createOrder(input));
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('razorpayPaymentProvider.verifyPayment', () => {
  it('accepts a valid signature', async () => {
    const { createHmac } = await import('node:crypto');
    const signature = createHmac('sha256', KEY_SECRET)
      .update(`${ORDER_ID}|pay_JK8Qn0nR6v2xNe`)
      .digest('hex');

    await expect(
      razorpayPaymentProvider.verifyPayment({
        providerOrderId: ORDER_ID,
        providerPaymentId: 'pay_JK8Qn0nR6v2xNe',
        signature,
      }),
    ).resolves.toBe(true);
  });

  it('rejects an invalid signature', async () => {
    await expect(
      razorpayPaymentProvider.verifyPayment({
        providerOrderId: ORDER_ID,
        providerPaymentId: 'pay_JK8Qn0nR6v2xNe',
        signature: 'a'.repeat(64),
      }),
    ).resolves.toBe(false);
  });

  it('fails closed with SERVICE_UNAVAILABLE when the secret is missing', async () => {
    delete process.env.RAZORPAY_KEY_SECRET;

    const error = await catchError(
      razorpayPaymentProvider.verifyPayment({
        providerOrderId: ORDER_ID,
        providerPaymentId: 'pay_JK8Qn0nR6v2xNe',
        signature: 'a'.repeat(64),
      }),
    );
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
