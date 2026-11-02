import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBlogPost,
  getStorefrontPostBySlug,
  updateBlogPost,
} from './blog.service';
import * as repo from './blog.repository';

vi.mock('./blog.repository', () => ({
  listPublishedPosts: vi.fn(),
  listAdminPosts: vi.fn(),
  getPostById: vi.fn(),
  getPostBySlug: vi.fn(),
  slugExists: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

const postRecord = {
  id: 'b1',
  title: 'Caring for Full-Grain Leather',
  slug: 'caring-for-full-grain-leather',
  metaDescription: '',
  excerpt: '',
  content: '## Why it matters',
  coverImageUrl: '',
  tags: [],
  status: 'draft' as const,
  publishedAt: null,
  authorName: '',
  canonicalUrl: '',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createBlogPost', () => {
  it('generates a slug from the title and persists the post', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(false);
    vi.mocked(repo.createPost).mockResolvedValue({ ...postRecord, slug: 'caring-for-full-grain-leather' });

    await createBlogPost({ title: 'Caring for Full-Grain Leather', content: 'Body' });

    expect(repo.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'caring-for-full-grain-leather', status: 'draft', publishedAt: null }),
    );
  });

  it('uses an explicit slug and sets a publish date when publishing', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(false);
    vi.mocked(repo.createPost).mockResolvedValue({ ...postRecord, status: 'published' });

    await createBlogPost({
      title: 'A Post',
      slug: 'my-custom-slug',
      content: 'Body',
      status: 'published',
    });

    expect(repo.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'my-custom-slug', status: 'published' }),
    );
    const persisted = vi.mocked(repo.createPost).mock.calls[0][0];
    expect(persisted.publishedAt).toBeInstanceOf(Date);
  });

  it('rejects an explicit slug that already exists', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(true);

    await expect(
      createBlogPost({ title: 'A Post', slug: 'taken', content: 'Body' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(repo.createPost).not.toHaveBeenCalled();
  });

  it('suffixes an auto-generated slug that already exists', async () => {
    vi.mocked(repo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.mocked(repo.createPost).mockResolvedValue({ ...postRecord, slug: 'caring-for-full-grain-leather-2' });

    await createBlogPost({ title: 'Caring for Full-Grain Leather', content: 'Body' });

    expect(repo.createPost).toHaveBeenCalledWith(expect.objectContaining({ slug: 'caring-for-full-grain-leather-2' }));
  });
});

describe('updateBlogPost', () => {
  it('keeps the existing publish date when republishing a published post', async () => {
    vi.mocked(repo.getPostById).mockResolvedValue({
      ...postRecord,
      status: 'published',
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(repo.updatePost).mockResolvedValue({ ...postRecord, status: 'published' });

    await updateBlogPost('b1', { status: 'published' });

    const persisted = vi.mocked(repo.updatePost).mock.calls[0][1];
    expect(persisted.publishedAt).toBeUndefined();
  });

  it('rejects an invalid canonical URL', async () => {
    vi.mocked(repo.getPostById).mockResolvedValue(postRecord);

    await expect(updateBlogPost('b1', { canonicalUrl: 'not-a-url' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('getStorefrontPostBySlug', () => {
  it('returns a published post', async () => {
    vi.mocked(repo.getPostBySlug).mockResolvedValue({ ...postRecord, status: 'published' });

    const post = await getStorefrontPostBySlug('caring-for-full-grain-leather');

    expect(post.slug).toBe('caring-for-full-grain-leather');
  });

  it('throws NOT_FOUND for a draft post', async () => {
    vi.mocked(repo.getPostBySlug).mockResolvedValue(postRecord);

    await expect(getStorefrontPostBySlug('caring-for-full-grain-leather')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
