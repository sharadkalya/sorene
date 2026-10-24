import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import { requestReturn } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/orders/[id]/return — request a return for one of the
 * authenticated customer's delivered orders (within the return window). An
 * admin approves or rejects it separately.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { id } = await params;
    const order = await requestReturn(session.customerId, id);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
