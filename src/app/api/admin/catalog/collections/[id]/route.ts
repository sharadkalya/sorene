import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { deleteCollection, updateCollection } from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/catalog/collections/[id] — update a collection. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const collection = await updateCollection(id, body);
    return NextResponse.json({ success: true, collection });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/admin/catalog/collections/[id] — delete a collection. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteCollection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
