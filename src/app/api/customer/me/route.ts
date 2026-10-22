import { NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { jsonError } from '@/backend/http';
import { getCustomerOrNull } from '@/backend/features/customer/customer.service';

/**
 * GET /api/customer/me
 * Return the authenticated customer (with saved addresses), or 401 when there
 * is no valid customer session.
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
