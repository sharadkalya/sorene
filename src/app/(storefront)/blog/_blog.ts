import { cache } from 'react';
import { getStorefrontPostBySlug, getStorefrontPosts } from '@/backend/features/blog/blog.service';

/**
 * Server-side helpers shared by the blog storefront pages. Not a route (the
 * `_` prefix excludes this file from the App Router). `cache` dedupes the
 * query between `generateMetadata` and the page component within one request.
 */
export const loadPosts = cache(() => getStorefrontPosts());
export const loadPost = cache((slug: string) => getStorefrontPostBySlug(slug));
