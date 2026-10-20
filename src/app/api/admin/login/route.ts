import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { createAdminSession } from '@/backend/auth/session';
import { isAdminAuthConfigured, verifyAdminCredentials } from '@/backend/auth/credentials';
import { clientIp, rateLimit } from '@/backend/auth/rate-limit';

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return jsonError(new AppError('FORBIDDEN', 'Admin login is not configured.'));
  }

  const limit = rateLimit(clientIp(request), {
    limit: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  });
  if (limit.limited) {
    return jsonError(new AppError('RATE_LIMITED', 'Too many login attempts. Please try again later.'));
  }

  try {
    const body: unknown = await request.json();
    const { username, password } = extractCredentials(body);

    if (!verifyAdminCredentials(username, password)) {
      return jsonError(new AppError('UNAUTHORIZED', 'Invalid username or password.'));
    }

    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}

function extractCredentials(body: unknown): { username: string; password: string } {
  if (typeof body !== 'object' || body === null) {
    throw new AppError('VALIDATION_ERROR', 'Username and password are required.');
  }
  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Username and password are required.');
  }
  return { username, password };
}
