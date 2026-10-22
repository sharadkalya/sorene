import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { clientIp, rateLimit } from '@/backend/auth/rate-limit';
import { requestOtp } from '@/backend/features/customer/otp.service';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP = 5;

/**
 * POST /api/customer/otp/request
 * Generate a one-time code and send it to the phone number over WhatsApp.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientIp(request), { limit: MAX_REQUESTS_PER_IP, windowMs: WINDOW_MS });
  if (limit.limited) {
    return jsonError(new AppError('RATE_LIMITED', 'Too many requests. Please try again later.'));
  }

  try {
    const body = await parseJsonBody(request);
    const result = await requestOtp(body);
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
