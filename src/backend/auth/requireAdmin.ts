import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { hasAdminSession } from './session';

/**
 * Authorization guards for admin-only operations.
 *
 * Route handlers call `requireAdminApi`; Server Components/layouts call
 * `requireAdminPage`. Authorization is always enforced server-side — the
 * client can never grant itself access.
 */

/** Returns `null` when authorized, otherwise an error response to return. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await hasAdminSession()) {
    return null;
  }
  return jsonError(new AppError('UNAUTHORIZED', 'Authentication required.'));
}

/** Redirects to the login page when the request has no valid admin session. */
export async function requireAdminPage(): Promise<void> {
  if (!(await hasAdminSession())) {
    redirect('/admin/login');
  }
}
