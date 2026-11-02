import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { createBlogPost, getAdminPosts } from '@/backend/features/blog/blog.service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/blog — admin list (includes drafts). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const posts = await getAdminPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/blog — create a blog post. */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body: unknown = await request.json();
    const post = await createBlogPost(body);
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
