import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import {
  listCustomerOrders,
  placeOrder,
} from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

/** POST /api/customer/orders — place an order for the authenticated customer. */
export async function POST(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const order = await placeOrder(session.customerId, body);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

/** GET /api/customer/orders — the authenticated customer's orders, newest first. */
export async function GET() {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const orders = await listCustomerOrders(session.customerId);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return jsonError(error);
  }
}

async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON.');
  }
}
