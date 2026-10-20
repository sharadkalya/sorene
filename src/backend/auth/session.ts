import { cookies } from 'next/headers';
import { getAdminSessionSecret } from '@/common/env';
import {
  ADMIN_SESSION_COOKIE,
  DEFAULT_TTL_MS,
  signAdminToken,
  verifyAdminToken,
} from './token';

/**
 * Next.js-coupled admin session helpers: read/write the signed HttpOnly cookie.
 * Token signing/verification lives in `token.ts` for testability.
 */

export async function createAdminSession(): Promise<void> {
  const token = signAdminToken(getAdminSessionSecret());
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEFAULT_TTL_MS / 1000,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) {
    return false;
  }
  try {
    return verifyAdminToken(value, getAdminSessionSecret());
  } catch {
    return false;
  }
}
