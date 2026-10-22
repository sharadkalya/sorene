import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/backend/errors';

vi.mock('@/backend/integrations/whatsapp/whatsapp-client', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

import { sendWhatsAppMessage } from '@/backend/integrations/whatsapp/whatsapp-client';
import {
  handleWebhookEvent,
  sendTestNotification,
  verifyWebhookSubscription,
} from './whatsapp.service';

const sendMock = vi.mocked(sendWhatsAppMessage);

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'test-verify-token';

function signed(payload: unknown): { body: Buffer; signature: string } {
  const body = Buffer.from(JSON.stringify(payload));
  return {
    body,
    signature: `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`,
  };
}

async function rejection(fn: () => unknown): Promise<AppError> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error('Expected rejection');
}

// Each test starts 11 minutes later so process-local rate-limit windows never carry over.
let clock = new Date('2026-01-01T00:00:00Z').getTime();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  clock += 11 * 60_000;
  vi.setSystemTime(clock);
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN;
  sendMock.mockResolvedValue({ messageId: 'wamid.OK' });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_VERIFY_TOKEN;
});

describe('sendTestNotification', () => {
  it('sends the hello_world template to the normalized number', async () => {
    const result = await sendTestNotification('+91 98765-43210');

    expect(sendMock).toHaveBeenCalledWith('919876543210', {
      type: 'template',
      name: 'hello_world',
      languageCode: 'en_US',
    });
    expect(result).toEqual({
      status: 'accepted',
      messageId: 'wamid.OK',
      template: 'hello_world',
      recipient: '********3210',
    });
  });

  it.each([null, undefined, '', 'abc', '123', '9198765432101234567'])(
    'rejects invalid recipient %j without calling Meta',
    async (to) => {
      const error = await rejection(() => sendTestNotification(to));

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(sendMock).not.toHaveBeenCalled();
    },
  );

  it('rate-limits repeated sends to the same recipient', async () => {
    for (let i = 0; i < 3; i++) {
      await sendTestNotification('919876543210');
    }

    const error = await rejection(() => sendTestNotification('919876543210'));

    expect(error.code).toBe('RATE_LIMITED');
    expect(sendMock).toHaveBeenCalledTimes(3);
  });

  it('rate-limits overall volume across different recipients', async () => {
    for (let i = 0; i < 5; i++) {
      await sendTestNotification(`9198765432${String(i).padStart(2, '0')}`);
    }

    const error = await rejection(() => sendTestNotification('919876543299'));

    expect(error.code).toBe('RATE_LIMITED');
    expect(sendMock).toHaveBeenCalledTimes(5);
  });

  it('allows sending again once the window has passed', async () => {
    for (let i = 0; i < 3; i++) {
      await sendTestNotification('919876543210');
    }
    vi.setSystemTime(clock + 10 * 60_000 + 1);

    await expect(sendTestNotification('919876543210')).resolves.toMatchObject({ status: 'accepted' });
  });

  it('propagates provider errors unchanged', async () => {
    sendMock.mockRejectedValue(new AppError('VALIDATION_ERROR', 'not on allowed list'));

    const error = await rejection(() => sendTestNotification('919876543210'));

    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('does not log the full phone number', async () => {
    await sendTestNotification('919876543210');

    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain('919876543210');
  });
});

describe('verifyWebhookSubscription', () => {
  const valid = { mode: 'subscribe', token: VERIFY_TOKEN, challenge: '1158201444' };

  it('returns the challenge for a valid handshake', () => {
    expect(verifyWebhookSubscription(valid)).toBe('1158201444');
  });

  it('forbids a wrong token', async () => {
    const error = await rejection(() => verifyWebhookSubscription({ ...valid, token: 'nope' }));
    expect(error.code).toBe('FORBIDDEN');
  });

  it('forbids missing parameters and wrong mode', async () => {
    expect((await rejection(() => verifyWebhookSubscription({ mode: null, token: null, challenge: null }))).code).toBe('FORBIDDEN');
    expect((await rejection(() => verifyWebhookSubscription({ ...valid, mode: 'unsubscribe' }))).code).toBe('FORBIDDEN');
  });

  it('fails closed when the verify token is not configured', async () => {
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    const error = await rejection(() => verifyWebhookSubscription(valid));
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('handleWebhookEvent', () => {
  const statusPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                { id: 'wamid.1', status: 'delivered', recipient_id: '919876543210' },
                { id: 'wamid.2', status: 'failed', recipient_id: '919876543211', errors: [{ code: 131030 }] },
              ],
            },
          },
        ],
      },
    ],
  };

  it('extracts status updates from a correctly signed payload', () => {
    const { body, signature } = signed(statusPayload);

    const updates = handleWebhookEvent(body, signature);

    expect(updates).toEqual([
      { messageId: 'wamid.1', status: 'delivered', recipient: '********3210', errorCodes: [] },
      { messageId: 'wamid.2', status: 'failed', recipient: '********3211', errorCodes: [131030] },
    ]);
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain('919876543210');
  });

  it('accepts signed payloads that carry no statuses (e.g. inbound messages)', () => {
    const { body, signature } = signed({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: {} }] }] });
    expect(handleWebhookEvent(body, signature)).toEqual([]);
  });

  it('rejects a missing or invalid signature', async () => {
    const { body, signature } = signed(statusPayload);

    expect((await rejection(() => handleWebhookEvent(body, null))).code).toBe('UNAUTHORIZED');
    expect((await rejection(() => handleWebhookEvent(body, signature.replace(/.$/, '0')))).code).toBe('UNAUTHORIZED');
    expect((await rejection(() => handleWebhookEvent(Buffer.from('{}'), signature))).code).toBe('UNAUTHORIZED');
  });

  it('rejects a validly signed but malformed or unsupported body', async () => {
    const notJson = Buffer.from('not json');
    const badSig = `sha256=${createHmac('sha256', APP_SECRET).update(notJson).digest('hex')}`;
    expect((await rejection(() => handleWebhookEvent(notJson, badSig))).code).toBe('VALIDATION_ERROR');

    const wrongShape = signed({ nope: true });
    expect((await rejection(() => handleWebhookEvent(wrongShape.body, wrongShape.signature))).code).toBe('VALIDATION_ERROR');
  });

  it('rejects oversized bodies before doing any work', async () => {
    const big = Buffer.alloc(1024 * 1024 + 1, 'a');
    expect((await rejection(() => handleWebhookEvent(big, 'sha256=x'))).code).toBe('VALIDATION_ERROR');
  });

  it('fails closed when the app secret is not configured', async () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const { body, signature } = signed(statusPayload);
    expect((await rejection(() => handleWebhookEvent(body, signature))).code).toBe('SERVICE_UNAVAILABLE');
  });
});
