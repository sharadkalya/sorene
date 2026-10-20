import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { checkStorageHealth } from '@/backend/integrations/storage/r2-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status/r2
 * Admin-only diagnostic: uploads a tiny test image to R2, deletes it, and
 * reports whether the storage integration is working.
 */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) {
    return denied;
  }

  const health = await checkStorageHealth();
  return NextResponse.json(
    { success: health.ok, storage: health },
    { status: health.ok ? 200 : 503 },
  );
}
