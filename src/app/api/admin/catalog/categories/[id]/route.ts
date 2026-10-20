import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { deleteCategory, updateCategory } from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/catalog/categories/[id] — update a category. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const category = await updateCategory(id, body);
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/admin/catalog/categories/[id] — delete a category. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
