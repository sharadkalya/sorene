import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { clientIp, rateLimit } from '@/backend/auth/rate-limit';
import { registerInterest } from '@/backend/features/subscribers/subscriber.service';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

/**
 * POST /api/stay-tuned
 * Register interest from the stay-tuned form. Thin HTTP adapter: validation,
 * persistence, and email delivery live in the subscribers feature module.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientIp(request), { limit: MAX_ATTEMPTS, windowMs: WINDOW_MS });
  if (limit.limited) {
    return jsonError(new AppError('RATE_LIMITED', 'Too many requests. Please try again later.'));
  }

  try {
    const body = await parseJsonBody(request);
    const result = await registerInterest(body);
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
