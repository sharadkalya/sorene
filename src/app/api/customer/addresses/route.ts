import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import { addCustomerAddress } from '@/backend/features/customer/customer.service';

/**
 * POST /api/customer/addresses
 * Save a shipping address for the authenticated customer.
 */
export async function POST(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const result = await addCustomerAddress(session.customerId, body);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
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
