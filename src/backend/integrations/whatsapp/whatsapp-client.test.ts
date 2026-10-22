import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/backend/errors';
import { sendWhatsAppMessage } from './whatsapp-client';

const TOKEN = 'EAAtesttoken1234567890';
const template = { type: 'template', name: 'hello_world', languageCode: 'en_US' } as const;

const fetchMock = vi.fn();

function graphResponse(status: number, body: unknown): Response {
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
  process.env.WHATSAPP_ACCESS_TOKEN = TOKEN;
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789012345';
  process.env.WHATSAPP_API_VERSION = 'v23.0';
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_API_VERSION;
});

describe('sendWhatsAppMessage', () => {
  it('posts a template message to the configured Graph API endpoint', async () => {
    fetchMock.mockResolvedValue(
      graphResponse(200, { messages: [{ id: 'wamid.ABC' }], contacts: [{ wa_id: '919876543210' }] }),
    );

    const result = await sendWhatsAppMessage('919876543210', template);

    expect(result).toEqual({ messageId: 'wamid.ABC', recipientWaId: '919876543210' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v23.0/123456789012345/messages');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'template',
      template: { name: 'hello_world', language: { code: 'en_US' } },
    });
  });

  it('builds a text payload', async () => {
    fetchMock.mockResolvedValue(graphResponse(200, { messages: [{ id: 'wamid.T' }] }));

    await sendWhatsAppMessage('919876543210', { type: 'text', body: 'hi' });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.type).toBe('text');
    expect(payload.text).toEqual({ preview_url: false, body: 'hi' });
  });

  it('includes body parameters on templated messages (e.g. OTP codes)', async () => {
    fetchMock.mockResolvedValue(graphResponse(200, { messages: [{ id: 'wamid.OTP' }] }));

    await sendWhatsAppMessage('919876543210', {
      type: 'template',
      name: 'sorvene_otp',
      languageCode: 'en_US',
      parameters: ['123456'],
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.template.components).toEqual([
      { type: 'body', parameters: [{ type: 'text', text: '123456' }] },
    ]);
  });

  it('uses the version from WHATSAPP_API_VERSION', async () => {
    process.env.WHATSAPP_API_VERSION = 'v25.0';
    fetchMock.mockResolvedValue(graphResponse(200, { messages: [{ id: 'wamid.V' }] }));

    await sendWhatsAppMessage('919876543210', template);

    expect(fetchMock.mock.calls[0][0]).toContain('/v25.0/');
  });

  describe('configuration', () => {
    it.each(['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_API_VERSION'])(
      'fails with SERVICE_UNAVAILABLE and never calls Meta when %s is missing',
      async (name) => {
        delete process.env[name];

        const error = await catchError(sendWhatsAppMessage('919876543210', template));

        expect(error.code).toBe('SERVICE_UNAVAILABLE');
        expect(error.message).not.toContain(name);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it.each(['3f2a9b', 'v23', '23.0', 'v23.0/../x', 'https://evil.example'])(
      'rejects malformed WHATSAPP_API_VERSION %j without echoing it',
      async (version) => {
        process.env.WHATSAPP_API_VERSION = version;

        const error = await catchError(sendWhatsAppMessage('919876543210', template));

        expect(error.code).toBe('SERVICE_UNAVAILABLE');
        expect(error.message).not.toContain(version);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('rejects a non-numeric phone number ID so the URL path cannot be altered', async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = '123/../../me';

      const error = await catchError(sendWhatsAppMessage('919876543210', template));

      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Meta API errors', () => {
    const cases: [string, number, Record<string, unknown>, string, number][] = [
      ['recipient not in allowed list', 400, { code: 131030 }, 'VALIDATION_ERROR', 400],
      ['recipient not a WhatsApp user', 400, { code: 131026 }, 'VALIDATION_ERROR', 400],
      ['expired token', 401, { code: 190, type: 'OAuthException' }, 'UPSTREAM_ERROR', 502],
      ['HTTP 429', 429, { code: 4 }, 'RATE_LIMITED', 429],
      ['pair rate limit', 400, { code: 131056 }, 'RATE_LIMITED', 429],
      ['missing template', 404, { code: 132001 }, 'UPSTREAM_ERROR', 502],
      ['server error', 500, { code: 1 }, 'UPSTREAM_ERROR', 502],
    ];

    it.each(cases)('maps %s', async (_name, httpStatus, error, code, status) => {
      fetchMock.mockResolvedValue(
        graphResponse(httpStatus, { error: { message: 'raw provider text', fbtrace_id: 'trace', ...error } }),
      );

      const thrown = await catchError(sendWhatsAppMessage('919876543210', template));

      expect(thrown.code).toBe(code);
      expect(thrown.status).toBe(status);
      expect(thrown.message).not.toContain('raw provider text');
      expect(thrown.message).not.toContain(TOKEN);
    });

    it('handles a non-JSON error body', async () => {
      fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));

      const error = await catchError(sendWhatsAppMessage('919876543210', template));

      expect(error.code).toBe('UPSTREAM_ERROR');
      expect(error.message).not.toContain('html');
    });

    it('rejects a 200 response without a message id', async () => {
      fetchMock.mockResolvedValue(graphResponse(200, { messages: [] }));

      const error = await catchError(sendWhatsAppMessage('919876543210', template));

      expect(error.code).toBe('UPSTREAM_ERROR');
    });

    it('does not log the access token', async () => {
      const spy = vi.mocked(console.error);
      fetchMock.mockResolvedValue(graphResponse(401, { error: { message: 'bad token', code: 190 } }));

      await catchError(sendWhatsAppMessage('919876543210', template));

      expect(JSON.stringify(spy.mock.calls)).not.toContain(TOKEN);
      expect(JSON.stringify(spy.mock.calls)).not.toContain('919876543210');
    });
  });

  describe('network failures', () => {
    it('maps a connection failure to UPSTREAM_ERROR', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const error = await catchError(sendWhatsAppMessage('919876543210', template));

      expect(error.code).toBe('UPSTREAM_ERROR');
      expect(error.message).not.toContain('fetch failed');
    });

    it('aborts the request and maps it to UPSTREAM_TIMEOUT after 10 seconds', async () => {
      vi.useFakeTimers();
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              const abort = new Error('aborted');
              abort.name = 'AbortError';
              reject(abort);
            });
          }),
      );

      const pending = catchError(sendWhatsAppMessage('919876543210', template));
      await vi.advanceTimersByTimeAsync(10_000);
      const error = await pending;

      expect(error.code).toBe('UPSTREAM_TIMEOUT');
      expect(error.status).toBe(504);
    });
  });
});
