import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const APP_SECRET = 'route-app-secret';
const VERIFY_TOKEN = 'route-verify-token';

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_VERIFY_TOKEN;
});

function verifyRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/webhooks/whatsapp');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url);
}

function postRequest(body: string, signature?: string): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/whatsapp', {
    method: 'POST',
    body,
    headers: signature ? { 'x-hub-signature-256': signature } : {},
  });
}

describe('GET /api/webhooks/whatsapp', () => {
  it('echoes the challenge as plain text for a valid handshake', async () => {
    const response = await GET(
      verifyRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '4242' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toBe('4242');
  });

  it('returns 403 for a wrong verify token', async () => {
    const response = await GET(
      verifyRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '4242' }),
    );

    expect(response.status).toBe(403);
  });
});

describe('POST /api/webhooks/whatsapp', () => {
  const payload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.1', status: 'read' }] } }] }],
  });
  const signature = `sha256=${createHmac('sha256', APP_SECRET).update(payload).digest('hex')}`;

  it('acknowledges a correctly signed delivery', async () => {
    const response = await POST(postRequest(payload, signature));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it('returns 401 for a missing signature', async () => {
    expect((await POST(postRequest(payload))).status).toBe(401);
  });

  it('returns 401 for a forged signature', async () => {
    const forged = `sha256=${createHmac('sha256', 'attacker').update(payload).digest('hex')}`;
    expect((await POST(postRequest(payload, forged))).status).toBe(401);
  });
});
