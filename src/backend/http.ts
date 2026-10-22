import { NextResponse } from 'next/server';
import { AppError } from './errors';

/**
 * Translate any thrown value into a consistent, non-leaking API response.
 * Expected `AppError`s map to their status code; anything else is logged
 * server-side and returned as a generic 500.
 */
export function jsonError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' },
    },
    { status: 500 },
  );
}

/**
 * True when the browser reports the request was initiated by another site.
 * Used to stop cookie-authenticated GET endpoints that cause side effects from
 * being triggered by a link or image on a third-party page (SameSite=Lax still
 * sends cookies on cross-site top-level navigations). Non-browser clients omit
 * the header and are unaffected.
 */
export function isCrossSiteRequest(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site === 'cross-site' || site === 'same-site';
}
