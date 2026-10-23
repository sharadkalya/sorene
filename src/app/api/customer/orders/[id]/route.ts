import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import { getCustomerOrder } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

/** GET /api/customer/orders/[id] — one of the authenticated customer's orders. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { id } = await params;
    const order = await getCustomerOrder(session.customerId, id);
    if (!order) {
      return jsonError(new AppError('NOT_FOUND', 'Order not found.'));
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
