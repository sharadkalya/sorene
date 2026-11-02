import type { MetadataRoute } from 'next';
import { getStorefrontPosts } from '@/backend/features/blog/blog.service';
import { getSiteUrl } from '@/common/env';

export const dynamic = 'force-dynamic';

/** Sitemap: static storefront routes plus every published blog post. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes = ['', '/shop', '/blog'];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  }));

  try {
    const posts = await getStorefrontPosts();
    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // A missing/unreachable database shouldn't take down the sitemap — serve
    // the static routes only until the connection recovers.
  }

  return entries;
}
