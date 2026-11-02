import type { Metadata } from 'next';
import { loadPosts } from './_blog';
import BlogIndex from '@/frontend/features/storefront/BlogIndex';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog — SORvÈNE',
  description: 'Stories on quiet luxury, craftsmanship, and the intention behind every SORvÈNE bag.',
};

/** Storefront: blog index listing all published posts. */
export default async function BlogPage() {
  const posts = await loadPosts();
  return <BlogIndex posts={posts} />;
}
