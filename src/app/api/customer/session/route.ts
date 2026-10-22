import { NextResponse } from 'next/server';
import { jsonError } from '@/backend/http';
import { destroyCustomerSession } from '@/backend/auth/customer-session';

/** DELETE /api/customer/session — sign the customer out. */
export async function DELETE() {
  try {
    await destroyCustomerSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
