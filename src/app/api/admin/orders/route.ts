import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { listAdminOrders } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/orders — all orders (admin shape), newest first. */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const orders = await listAdminOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return jsonError(error);
  }
}
