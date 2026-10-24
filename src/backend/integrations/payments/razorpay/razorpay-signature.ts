import { createHmac, timingSafeEqual } from 'node:crypto';

const HEX_SIGNATURE_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Verify Razorpay's payment signature: hex HMAC-SHA256 of
 * `<orderId>|<paymentId>`, keyed with the Razorpay key secret. Constant-time
 * compare; fails closed on any malformed input.
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) {
    return false;
  }
  if (!HEX_SIGNATURE_PATTERN.test(signature)) {
    return false;
  }

  const expected = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const provided = Buffer.from(signature, 'hex');
  if (expected.length !== provided.length) {
    return false;
  }
  return timingSafeEqual(expected, provided);
}
