import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import {
  createProduct,
  getAdminProducts,
} from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/catalog/products — admin list (all statuses). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const products = await getAdminProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/catalog/products — create a product. */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body: unknown = await request.json();
    const product = await createProduct(body);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
