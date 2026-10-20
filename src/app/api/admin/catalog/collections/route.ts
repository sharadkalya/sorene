import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import {
  createCollection,
  getAdminCollections,
} from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/catalog/collections — admin list (includes hidden). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const collections = await getAdminCollections();
    return NextResponse.json({ success: true, collections });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/catalog/collections — create a collection. */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body: unknown = await request.json();
    const collection = await createCollection(body);
    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
