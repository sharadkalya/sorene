import { z } from 'zod';

/** Zod schemas for catalog inputs, reused at the API boundary. */

const imageUrl = z
  .string()
  .trim()
  .min(1, 'Image URL is required')
  .max(1000, 'Image URL is too long');

const nameField = (label: string) =>
  z.string().trim().min(1, `${label} name is required`).max(120, `${label} name cannot exceed 120 characters`);

const descriptionField = z
  .string()
  .trim()
  .max(600, 'Description cannot exceed 600 characters')
  .optional();

export const categoryInputSchema = z.object({
  name: nameField('Category'),
  description: descriptionField,
  imageUrl: imageUrl.optional(),
  isActive: z.boolean().optional(),
});

export const collectionInputSchema = z.object({
  name: nameField('Collection'),
  description: descriptionField,
  imageUrl: imageUrl.optional(),
  isActive: z.boolean().optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160, 'Name cannot exceed 160 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  compareAtPrice: z.coerce
    .number()
    .min(0, 'Compare-at price cannot be negative')
    .nullable()
    .optional(),
  images: z.array(imageUrl).max(12, 'A product can have at most 12 images').default([]),
  categories: z.array(z.string().min(1)).max(30, 'Too many categories').default([]),
  collections: z.array(z.string().min(1)).max(30, 'Too many collections').default([]),
  status: z.enum(['draft', 'active']).default('draft'),
  featured: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CollectionInput = z.infer<typeof collectionInputSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
