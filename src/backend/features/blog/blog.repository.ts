import { getMongoConnection } from '@/backend/integrations/database/connection';
import BlogPostModel, { type IBlogPost } from '@/backend/integrations/database/models/BlogPost';
import type { BlogPostRecord, BlogStatus } from './blog.types';

/**
 * Persistence for the blog feature. Every function awaits the shared Mongoose
 * connection before touching the model (models buffer silently otherwise).
 */

type DocWithId<T> = T & { _id: { toString(): string } };

export interface BlogPostData {
  title: string;
  slug: string;
  metaDescription?: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  tags: string[];
  status: BlogStatus;
  publishedAt: Date | null;
  authorName?: string;
  canonicalUrl?: string;
}

function toBlogPostRecord(doc: DocWithId<IBlogPost>): BlogPostRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    metaDescription: doc.metaDescription ?? '',
    excerpt: doc.excerpt ?? '',
    content: doc.content,
    coverImageUrl: doc.coverImageUrl ?? '',
    tags: doc.tags ?? [],
    status: doc.status,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    authorName: doc.authorName ?? '',
    canonicalUrl: doc.canonicalUrl ?? '',
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

export async function listPublishedPosts(): Promise<BlogPostRecord[]> {
  await getMongoConnection();
  const docs = await BlogPostModel.find({ status: 'published' }).sort({ publishedAt: -1 }).exec();
  return docs.map((doc) => toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>));
}

export async function listAdminPosts(): Promise<BlogPostRecord[]> {
  await getMongoConnection();
  const docs = await BlogPostModel.find().sort({ updatedAt: -1 }).exec();
  return docs.map((doc) => toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>));
}

export async function getPostById(id: string): Promise<BlogPostRecord | null> {
  await getMongoConnection();
  const doc = await BlogPostModel.findById(id).exec();
  return doc ? toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>) : null;
}

export async function getPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  await getMongoConnection();
  const doc = await BlogPostModel.findOne({ slug }).exec();
  return doc ? toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>) : null;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  await getMongoConnection();
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await BlogPostModel.findOne(filter).select('_id').exec();
  return Boolean(doc);
}

export async function createPost(data: BlogPostData): Promise<BlogPostRecord> {
  await getMongoConnection();
  const doc = await BlogPostModel.create(data);
  return toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>);
}

export async function updatePost(id: string, data: Partial<BlogPostData>): Promise<BlogPostRecord | null> {
  await getMongoConnection();
  const doc = await BlogPostModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  return doc ? toBlogPostRecord(doc as unknown as DocWithId<IBlogPost>) : null;
}

export async function deletePost(id: string): Promise<boolean> {
  await getMongoConnection();
  const result = await BlogPostModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}
