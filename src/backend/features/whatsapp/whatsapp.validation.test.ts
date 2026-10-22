import { describe, expect, it } from 'vitest';
import {
  maskPhoneNumber,
  normalizePhoneNumber,
  recipientSchema,
  testNotificationQuerySchema,
  webhookVerificationSchema,
} from './whatsapp.validation';

describe('normalizePhoneNumber', () => {
  it.each([
    ['919876543210', '919876543210'],
    ['+919876543210', '919876543210'],
    [' 919876543210', '919876543210'], // "+" decoded as a space in a query string
    ['+91 98765-43210', '919876543210'],
    ['+1 (415) 555-2671', '14155552671'],
    ['00919876543210', '919876543210'],
    ['  919876543210  ', '919876543210'],
  ])('normalizes %j', (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it.each(['abc', '9198765x3210', '91+9876543210', 'tel:919876543210', '', '   '])(
    'returns empty for unsupported input %j',
    (input) => {
      expect(normalizePhoneNumber(input)).toBe('');
    },
  );
});

describe('recipientSchema', () => {
  it('accepts valid international numbers and returns the normalized form', () => {
    expect(recipientSchema.parse('+91 98765 43210')).toBe('919876543210');
    expect(recipientSchema.parse('12345678')).toBe('12345678'); // 8 digits: lower bound
    expect(recipientSchema.parse('123456789012345')).toBe('123456789012345'); // 15 digits: upper bound
  });

  it.each([
    '1234567', // too short
    '1234567890123456', // too long
    '0919876543210', // leading zero is not a country code
    '+',
    '',
    '9198765432;DROP',
    '91987654321 0 https://evil.example',
  ])('rejects %j', (input) => {
    expect(recipientSchema.safeParse(input).success).toBe(false);
  });

  it.each([null, undefined, 12345678901, {}, ['919876543210']])('rejects non-string %j', (input) => {
    expect(recipientSchema.safeParse(input).success).toBe(false);
  });

  it('requires the `to` field', () => {
    expect(testNotificationQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe('maskPhoneNumber', () => {
  it('keeps only the last four digits', () => {
    expect(maskPhoneNumber('919876543210')).toBe('********3210');
  });

  it('fully masks very short values', () => {
    expect(maskPhoneNumber('123')).toBe('****');
  });
});

describe('webhookVerificationSchema', () => {
  it('accepts a subscribe handshake', () => {
    expect(
      webhookVerificationSchema.safeParse({ mode: 'subscribe', token: 't', challenge: '12345' }).success,
    ).toBe(true);
  });

  it('rejects wrong mode, empty token, and unsafe challenge', () => {
    expect(webhookVerificationSchema.safeParse({ mode: 'x', token: 't', challenge: '1' }).success).toBe(false);
    expect(webhookVerificationSchema.safeParse({ mode: 'subscribe', token: '', challenge: '1' }).success).toBe(false);
    expect(
      webhookVerificationSchema.safeParse({ mode: 'subscribe', token: 't', challenge: '<script>' }).success,
    ).toBe(false);
    expect(webhookVerificationSchema.safeParse({ mode: null, token: null, challenge: null }).success).toBe(false);
  });
});
