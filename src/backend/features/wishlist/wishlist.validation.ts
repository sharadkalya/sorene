import { z } from 'zod';

/** A product slug added to or removed from a wishlist. */
export const wishlistAddSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

export type WishlistAddInput = z.infer<typeof wishlistAddSchema>;
