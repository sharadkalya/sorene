import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { listAdminOrders } from '@/backend/features/orders/orders.service';
import type { OrderStatus } from '@/backend/features/orders/orders.types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'completed',
  'cancellation_requested',
  'cancelled',
]);

/**
 * GET /api/admin/orders — paginated orders, optionally filtered by `status`.
 * Query params: `status`, `page` (1-based), `limit` (1–100, default 20).
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as OrderStatus) : undefined;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');

    const result = await listAdminOrders({ status, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
