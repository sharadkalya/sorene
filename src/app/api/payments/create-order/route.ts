import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { clientIp, rateLimit } from '@/backend/auth/rate-limit';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { createPaymentOrder } from '@/backend/features/payments/payment.service';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

/**
 * POST /api/payments/create-order — create a payment order for the checkout
 * (address + items). The amount is resolved server-side; no internal order is
 * created until `verify` succeeds. Thin HTTP adapter.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientIp(request), { limit: MAX_ATTEMPTS, windowMs: WINDOW_MS });
  if (limit.limited) {
    return jsonError(new AppError('RATE_LIMITED', 'Too many requests. Please try again later.'));
  }

  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const payment = await createPaymentOrder(session.customerId, body);
    return NextResponse.json({ success: true, payment }, { status: 201 });
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
