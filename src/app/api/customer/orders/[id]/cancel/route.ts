import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import { requestOrderCancellation } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/orders/[id]/cancel — request cancellation for one of the
 * authenticated customer's orders. Marks it `cancellation_requested`; an admin
 * confirms the cancellation separately.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { id } = await params;
    const order = await requestOrderCancellation(session.customerId, id);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
