import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { isCrossSiteRequest, jsonError } from '@/backend/http';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { sendTestNotification } from '@/backend/features/whatsapp/whatsapp.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status/whatsapp?to=919876543210
 * Admin-only diagnostic: sends Meta's approved `hello_world` template to the given number
 * (which must be a permitted test recipient while using Meta's test number).
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) {
    return denied;
  }

  try {
    if (isCrossSiteRequest(request)) {
      throw new AppError('FORBIDDEN', 'Cross-site requests are not allowed.');
    }

    const delivery = await sendTestNotification(request.nextUrl.searchParams.get('to'));
    return NextResponse.json({
      success: true,
      message: 'Test WhatsApp message accepted by Meta. Delivery status is reported asynchronously.',
      delivery,
    });
  } catch (error) {
    return jsonError(error);
  }
}
