import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { clientIp, rateLimit } from '@/backend/auth/rate-limit';
import { createCustomerSession } from '@/backend/auth/customer-session';
import { verifyOtp } from '@/backend/features/customer/otp.service';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_IP = 20;

/**
 * POST /api/customer/otp/verify
 * Verify the WhatsApp-delivered code and mint a customer session cookie.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientIp(request), { limit: MAX_ATTEMPTS_PER_IP, windowMs: WINDOW_MS });
  if (limit.limited) {
    return jsonError(new AppError('RATE_LIMITED', 'Too many attempts. Please try again later.'));
  }

  try {
    const body = await parseJsonBody(request);
    const customer = await verifyOtp(body);
    await createCustomerSession({ customerId: customer.id, phone: customer.phone });
    return NextResponse.json({ success: true, customer }, { status: 200 });
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
