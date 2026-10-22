import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/backend/http';
import {
  handleWebhookEvent,
  verifyWebhookSubscription,
} from '@/backend/features/whatsapp/whatsapp.service';

export const dynamic = 'force-dynamic';

/** GET /api/webhooks/whatsapp — Meta subscription verification handshake. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const challenge = verifyWebhookSubscription({
      mode: params.get('hub.mode'),
      token: params.get('hub.verify_token'),
      challenge: params.get('hub.challenge'),
    });
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/webhooks/whatsapp — signed delivery/status notifications from Meta. */
export async function POST(request: NextRequest) {
  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    handleWebhookEvent(rawBody, request.headers.get('x-hub-signature-256'));
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
