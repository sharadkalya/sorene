import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { verifyPayment } from '@/backend/features/payments/payment.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/verify — verify the provider payment signature reported
 * by the checkout. Thin HTTP adapter; signature checks live in the payments
 * feature module and the provider integration.
 */
export async function POST(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const result = await verifyPayment(session.customerId, body);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
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
