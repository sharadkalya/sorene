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
