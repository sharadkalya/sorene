import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { safeEqual, verifyWebhookSignature } from './whatsapp-signature';

const SECRET = 'app-secret-for-tests';
const body = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));

function sign(payload: Buffer, secret = SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

describe('verifyWebhookSignature', () => {
  it('accepts a correct signature', () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a signature made with a different secret', () => {
    expect(verifyWebhookSignature(body, sign(body, 'other'), SECRET)).toBe(false);
  });

  it('rejects a tampered body', () => {
    expect(verifyWebhookSignature(Buffer.from('{"object":"x"}'), sign(body), SECRET)).toBe(false);
  });

  it.each([null, '', 'sha256=', 'sha1=abc', 'sha256=zzzz', `sha256=${'a'.repeat(63)}`, 'abc'])(
    'rejects malformed header %j',
    (header) => {
      expect(verifyWebhookSignature(body, header, SECRET)).toBe(false);
    },
  );

  it('fails closed when the secret is empty', () => {
    expect(verifyWebhookSignature(body, sign(body, ''), '')).toBe(false);
  });
});

describe('safeEqual', () => {
  it('compares strings of any length', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', 'a')).toBe(false);
  });
});
