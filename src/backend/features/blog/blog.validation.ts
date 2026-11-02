import { z } from 'zod';

/** Zod schemas for blog inputs, reused at the API boundary. */

const tagField = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Tags cannot be empty')
      .max(50, 'Tags cannot exceed 50 characters'),
  )
  .max(20, 'A post can have at most 20 tags')
  .default([]);

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  slug: z.string().trim().max(120, 'Slug cannot exceed 120 characters').optional(),
  metaDescription: z
    .string()
    .trim()
    .max(300, 'Meta description cannot exceed 300 characters')
    .optional(),
  excerpt: z.string().trim().max(300, 'Excerpt cannot exceed 300 characters').optional(),
  content: z.string().min(1, 'Content is required').max(200000, 'Content is too long'),
  coverImageUrl: z.string().trim().max(1000, 'Cover image URL is too long').optional(),
  tags: tagField,
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid publish date')
    .optional(),
  authorName: z.string().trim().max(100, 'Author name cannot exceed 100 characters').optional(),
  canonicalUrl: z.string().trim().max(1000, 'Canonical URL is too long').optional(),
});

export const blogPostUpdateSchema = blogPostInputSchema.partial();

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
