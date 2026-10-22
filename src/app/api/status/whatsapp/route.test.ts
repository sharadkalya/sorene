import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/auth/requireAdmin', () => ({
  requireAdminApi: vi.fn(),
}));

import { requireAdminApi } from '@/backend/auth/requireAdmin';

const requireAdminMock = vi.mocked(requireAdminApi);
const fetchMock = vi.fn();

const TOKEN = 'EAAroutetoken987654321';

function request(query: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/status/whatsapp${query}`, { headers });
}

// Fresh module graph per test so the in-memory rate-limit buckets start empty.
async function loadRoute() {
  vi.resetModules();
  return import('./route');
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  requireAdminMock.mockResolvedValue(null);
  process.env.WHATSAPP_ACCESS_TOKEN = TOKEN;
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789012345';
  process.env.WHATSAPP_API_VERSION = 'v23.0';
  fetchMock.mockImplementation(async () =>
    new Response(JSON.stringify({ messages: [{ id: 'wamid.SENT' }] }), { status: 200 }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_API_VERSION;
});

describe('GET /api/status/whatsapp', () => {
  it('sends the test template and returns a sanitized success response', async () => {
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      delivery: {
        status: 'accepted',
        messageId: 'wamid.SENT',
        template: 'hello_world',
        recipient: '********3210',
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
    expect(JSON.stringify(body)).not.toContain('919876543210');
  });

  it('accepts a "+"-prefixed number (decoded to a space in the query string)', async () => {
    const { GET } = await loadRoute();

    const response = await GET(request('?to=+919876543210'));

    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).to).toBe('919876543210');
  });

  it('denies unauthenticated requests without calling Meta', async () => {
    requireAdminMock.mockResolvedValue(
      NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
    );
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['', '?to=', '?to=abc', '?to=123', '?to=91987654321x'])(
    'returns 400 for invalid recipient %j',
    async (query) => {
      const { GET } = await loadRoute();

      const response = await GET(request(query));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('ignores any attempt to override URL, token, or sender via query parameters', async () => {
    const { GET } = await loadRoute();

    await GET(request('?to=919876543210&url=https://evil.example&token=x&from=999&phoneNumberId=999'));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v23.0/123456789012345/messages');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('returns 503 when WhatsApp is not configured', async () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a Meta "recipient not allowed" error to a clear 400 without provider details', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 131030, message: 'raw meta text', fbtrace_id: 'abc' } }),
        { status: 400 },
      ),
    );
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toContain('allowed list');
    expect(text).not.toContain('raw meta text');
    expect(text).not.toContain('abc');
  });

  it('maps Meta credential failures to 502 without leaking the token', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 190, message: `Invalid token ${TOKEN}` } }), {
        status: 401,
      }),
    );
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).not.toContain(TOKEN);
  });

  it('returns 504 when Meta times out', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    fetchMock.mockRejectedValue(abort);
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210'));

    expect(response.status).toBe(504);
  });

  it('returns 429 after too many requests to the same number', async () => {
    const { GET } = await loadRoute();

    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await GET(request('?to=919876543210'))).status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns 429 after too many requests overall', async () => {
    const { GET } = await loadRoute();

    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await GET(request(`?to=9198765432${i}0`))).status);
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it.each(['cross-site', 'same-site'])('blocks browser requests with Sec-Fetch-Site: %s', async (site) => {
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210', { 'sec-fetch-site': site }));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['same-origin', 'none'])('allows Sec-Fetch-Site: %s', async (site) => {
    const { GET } = await loadRoute();

    const response = await GET(request('?to=919876543210', { 'sec-fetch-site': site }));

    expect(response.status).toBe(200);
  });
});
