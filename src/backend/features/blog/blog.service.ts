import { AppError } from '@/backend/errors';
import { slugify } from './blog.slug';
import * as repo from './blog.repository';
import {
  blogPostInputSchema,
  blogPostUpdateSchema,
  formatIssues,
  type BlogPostInput,
  type BlogPostUpdateInput,
} from './blog.validation';
import type { BlogPostRecord } from './blog.types';

/**
 * Blog business rules: validation, slug management, publish-date handling, and
 * storefront filtering. All persistence happens in `blog.repository`.
 */

interface ResolvedSlug {
  base: string;
  explicit: boolean;
}

function resolveSlugBase(data: { title?: string; slug?: string }): ResolvedSlug {
  if (data.slug !== undefined && data.slug.trim() !== '') {
    const base = slugify(data.slug);
    if (!base) throw new AppError('VALIDATION_ERROR', 'Slug must contain letters or numbers.');
    return { base, explicit: true };
  }

  const base = slugify(data.title ?? '');
  if (!base) {
    throw new AppError('VALIDATION_ERROR', 'Title must contain letters or numbers to generate a URL slug.');
  }
  return { base, explicit: false };
}

async function ensureUniqueSlug(base: string, explicit: boolean, excludeId?: string): Promise<string> {
  if (await repo.slugExists(base, excludeId)) {
    if (explicit) {
      throw new AppError('CONFLICT', 'A post with this slug already exists. Choose a different slug.');
    }
    let suffix = 2;
    while (await repo.slugExists(`${base}-${suffix}`, excludeId)) {
      suffix += 1;
    }
    return `${base}-${suffix}`;
  }
  return base;
}

function validateCanonicalUrl(value?: string): void {
  if (!value) return;
  try {
    // Canonical URLs must be absolute for search engines.
    new URL(value);
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Canonical URL must be a valid absolute URL (e.g. https://…).');
  }
}

function toPublishDate(value?: string): Date | null {
  return value ? new Date(value) : null;
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getAdminPosts(): Promise<BlogPostRecord[]> {
  return repo.listAdminPosts();
}

export async function createBlogPost(input: unknown): Promise<BlogPostRecord> {
  const parsed = blogPostInputSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const data = parsed.data as BlogPostInput;
  validateCanonicalUrl(data.canonicalUrl);

  const { base, explicit } = resolveSlugBase(data);
  const slug = await ensureUniqueSlug(base, explicit);

  let publishedAt = toPublishDate(data.publishedAt);
  if (data.status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }

  return repo.createPost({
    title: data.title,
    slug,
    metaDescription: data.metaDescription ?? '',
    excerpt: data.excerpt ?? '',
    content: data.content,
    coverImageUrl: data.coverImageUrl ?? '',
    tags: data.tags,
    status: data.status,
    publishedAt,
    authorName: data.authorName ?? '',
    canonicalUrl: data.canonicalUrl ?? '',
  });
}

export async function updateBlogPost(id: string, input: unknown): Promise<BlogPostRecord> {
  const parsed = blogPostUpdateSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const existing = await repo.getPostById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Post not found.');

  const data = parsed.data as BlogPostUpdateInput;
  validateCanonicalUrl(data.canonicalUrl);

  const patch: Record<string, unknown> = {};

  if (data.title !== undefined) patch.title = data.title;
  if (data.metaDescription !== undefined) patch.metaDescription = data.metaDescription;
  if (data.excerpt !== undefined) patch.excerpt = data.excerpt;
  if (data.content !== undefined) patch.content = data.content;
  if (data.coverImageUrl !== undefined) patch.coverImageUrl = data.coverImageUrl;
  if (data.tags !== undefined) patch.tags = data.tags;
  if (data.authorName !== undefined) patch.authorName = data.authorName;
  if (data.canonicalUrl !== undefined) patch.canonicalUrl = data.canonicalUrl;

  if (data.slug !== undefined) {
    const { base, explicit } = resolveSlugBase({ slug: data.slug, title: data.title ?? existing.title });
    patch.slug = await ensureUniqueSlug(base, explicit, id);
  }

  if (data.status !== undefined) {
    patch.status = data.status;
    if (data.status === 'published' && !existing.publishedAt && data.publishedAt === undefined) {
      patch.publishedAt = new Date();
    }
  }
  if (data.publishedAt !== undefined) patch.publishedAt = toPublishDate(data.publishedAt);

  const updated = await repo.updatePost(id, patch);
  if (!updated) throw new AppError('NOT_FOUND', 'Post not found.');
  return updated;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const existing = await repo.getPostById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Post not found.');
  await repo.deletePost(id);
}

// ─── Storefront ─────────────────────────────────────────────────────────────

export async function getStorefrontPosts(): Promise<BlogPostRecord[]> {
  return repo.listPublishedPosts();
}

export async function getStorefrontPostBySlug(slug: string): Promise<BlogPostRecord> {
  const post = await repo.getPostBySlug(slug);
  if (!post || post.status !== 'published') {
    throw new AppError('NOT_FOUND', 'Post not found.');
  }
  return post;
}
