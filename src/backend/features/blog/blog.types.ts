/** Shared response contracts for the blog feature. */

export type BlogStatus = 'draft' | 'published';

export interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  status: BlogStatus;
  publishedAt: string | null;
  authorName: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
}
