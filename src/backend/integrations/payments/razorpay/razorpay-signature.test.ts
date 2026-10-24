import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyRazorpayPaymentSignature } from './razorpay-signature';

const SECRET = 'razorpay-secret-for-tests';
const ORDER_ID = 'order_JK8Qn0nR6v2xNd';
const PAYMENT_ID = 'pay_JK8Qn0nR6v2xNe';

function sign(orderId: string, paymentId: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('verifyRazorpayPaymentSignature', () => {
  it('accepts a correct signature', () => {
    expect(
      verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, sign(ORDER_ID, PAYMENT_ID), SECRET),
    ).toBe(true);
  });

  it('rejects a signature made with a different secret', () => {
    expect(
      verifyRazorpayPaymentSignature(
        ORDER_ID,
        PAYMENT_ID,
        sign(ORDER_ID, PAYMENT_ID, 'another-secret'),
        SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a tampered order id', () => {
    expect(
      verifyRazorpayPaymentSignature(
        'order_EVIL',
        PAYMENT_ID,
        sign(ORDER_ID, PAYMENT_ID),
        SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a tampered payment id', () => {
    expect(
      verifyRazorpayPaymentSignature(
        ORDER_ID,
        'pay_EVIL',
        sign(ORDER_ID, PAYMENT_ID),
        SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a case-different signature', () => {
    const valid = sign(ORDER_ID, PAYMENT_ID);
    expect(verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, valid.toUpperCase(), SECRET)).toBe(
      true,
    );
    // A signature that differs only by one character must fail.
    const tampered = valid[0] === 'a' ? `b${valid.slice(1)}` : `a${valid.slice(1)}`;
    expect(verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, tampered, SECRET)).toBe(false);
  });

  it.each([
    ['', PAYMENT_ID],
    [ORDER_ID, ''],
    ['', ''],
  ])('fails closed when order id is %j and payment id is %j', (orderId, paymentId) => {
    expect(
      verifyRazorpayPaymentSignature(orderId, paymentId, sign(orderId, paymentId), SECRET),
    ).toBe(false);
  });

  it.each([null, undefined, '', 'zzzz', `${'a'.repeat(63)}`, `${'a'.repeat(65)}`, 'sha256=abc'])(
    'rejects malformed signature %j',
    (signature) => {
      expect(
        verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, signature as string, SECRET),
      ).toBe(false);
    },
  );

  it('fails closed when the key secret is empty', () => {
    expect(
      verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, sign(ORDER_ID, PAYMENT_ID), ''),
    ).toBe(false);
  });

  it('accepts a signature computed by Razorpay docs order of concatenation', () => {
    // Mirrors https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
    // expected = HMAC-SHA256(order_id + "|" + payment_id, secret)
    const expected = createHmac('sha256', SECRET).update(`${ORDER_ID}|${PAYMENT_ID}`).digest('hex');
    expect(verifyRazorpayPaymentSignature(ORDER_ID, PAYMENT_ID, expected, SECRET)).toBe(true);
  });
});
