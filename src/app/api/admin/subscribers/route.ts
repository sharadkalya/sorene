import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { getSubscribers } from '@/backend/features/subscribers/subscriber.service';

/**
 * GET /api/admin/subscribers
 * Admin-only list of stay-tuned subscribers, newest first.
 */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) {
    return denied;
  }

  try {
    const subscribers = await getSubscribers();
    return NextResponse.json({
      success: true,
      subscribers,
      total: subscribers.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
