import { describe, expect, it } from 'vitest';
import { blogPostInputSchema, blogPostUpdateSchema } from './blog.validation';

describe('blog validation', () => {
  it('accepts a valid post and applies defaults', () => {
    const result = blogPostInputSchema.safeParse({
      title: 'Caring for Full-Grain Leather',
      content: '## Why it matters',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects a post without a title', () => {
    const result = blogPostInputSchema.safeParse({ content: 'Body only' });
    expect(result.success).toBe(false);
  });

  it('rejects a post without content', () => {
    const result = blogPostInputSchema.safeParse({ title: 'No body' });
    expect(result.success).toBe(false);
  });

  it('accepts an explicit slug and SEO fields', () => {
    const result = blogPostInputSchema.safeParse({
      title: 'A Post',
      slug: 'a-post',
      metaDescription: 'A short description.',
      tags: ['leather', 'care'],
      status: 'published',
      canonicalUrl: 'https://example.com/a-post',
      content: 'Body',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const result = blogPostInputSchema.safeParse({
      title: 'A Post',
      content: 'Body',
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid publish date', () => {
    const result = blogPostInputSchema.safeParse({
      title: 'A Post',
      content: 'Body',
      publishedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('allows partial updates', () => {
    const result = blogPostUpdateSchema.safeParse({ status: 'published' });
    expect(result.success).toBe(true);
  });

  it('limits tags to 20', () => {
    const result = blogPostInputSchema.safeParse({
      title: 'A Post',
      content: 'Body',
      tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
    });
    expect(result.success).toBe(false);
  });
});
