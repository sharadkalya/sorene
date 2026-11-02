import { getAdminPosts } from '@/backend/features/blog/blog.service';
import BlogManager from '@/frontend/features/admin/blog/BlogManager';

export const dynamic = 'force-dynamic';

/** Admin: manage blog posts (CRUD, SEO fields, publish state). */
export default async function AdminBlogPage() {
  const posts = await getAdminPosts();
  return <BlogManager initialPosts={posts} />;
}
