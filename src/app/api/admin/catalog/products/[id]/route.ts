import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import {
  deleteProduct,
  updateProduct,
} from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/catalog/products/[id] — update a product. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const product = await updateProduct(id, body);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/admin/catalog/products/[id] — delete a product. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
