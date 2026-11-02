import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { deleteBlogPost, updateBlogPost } from '@/backend/features/blog/blog.service';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/blog/[id] — update a blog post. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const post = await updateBlogPost(id, body);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/admin/blog/[id] — delete a blog post. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteBlogPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
