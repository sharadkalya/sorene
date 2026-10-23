import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import {
  getCustomerOrNull,
  updateCustomerProfile,
} from '@/backend/features/customer/customer.service';

/**
 * GET /api/customer/me
 * Return the authenticated customer (with saved addresses, email, and
 * profile picture), or 401 when there is no valid customer session.
 */
export async function GET() {
  try {
    const session = await getCurrentCustomer();
    if (!session) {
      return jsonError(new AppError('UNAUTHORIZED', 'Please sign in to continue.'));
    }

    const customer = await getCustomerOrNull(session.customerId);
    if (!customer) {
      return jsonError(new AppError('UNAUTHORIZED', 'Please sign in to continue.'));
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/customer/me
 * Update the authenticated customer's name/email. Accepts `{ name?, email? }`
 * and returns the updated customer.
 */
export async function PATCH(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const customer = await updateCustomerProfile(session.customerId, body);
    return NextResponse.json({ success: true, customer });
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
