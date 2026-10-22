import { NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { getCurrentCustomer } from './customer-session';
import type { CustomerSessionPayload } from './customer-token';

/**
 * Authorization guard for customer-only operations. Returns the authenticated
 * principal when the request carries a valid customer session, otherwise an
 * error response the handler should return directly.
 */
export async function requireCustomerApi(): Promise<CustomerSessionPayload | NextResponse> {
  const session = await getCurrentCustomer();
  if (!session) {
    return jsonError(new AppError('UNAUTHORIZED', 'Please sign in to continue.'));
  }
  return session;
}
