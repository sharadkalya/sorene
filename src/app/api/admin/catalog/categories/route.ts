import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import {
  createCategory,
  getAdminCategories,
} from '@/backend/features/catalog/catalog.service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/catalog/categories — admin list (includes hidden). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const categories = await getAdminCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/catalog/categories — create a category. */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body: unknown = await request.json();
    const category = await createCategory(body);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
