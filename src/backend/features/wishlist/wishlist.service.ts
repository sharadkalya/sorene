import { AppError } from '@/backend/errors';
import { formatIssues } from '@/backend/features/customer/customer.validation';
import {
  addWishlistSlug,
  findActiveProductBySlug,
  getCustomerWishlist,
  hydrateWishlistProducts,
  removeWishlistSlug,
} from './wishlist.repository';
import type { WishlistProduct } from './wishlist.types';
import { wishlistAddSchema } from './wishlist.validation';

function parseSlug(input: unknown): string {
  const parsed = wishlistAddSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  return parsed.data.slug;
}

/** Hydrated wishlist for a customer, in the order the slugs were saved. */
export async function getWishlist(customerId: string): Promise<WishlistProduct[]> {
  const slugs = await getCustomerWishlist(customerId);
  if (slugs === null) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return hydrateWishlistProducts(slugs);
}

/** Number of hydrated (active) wishlist entries — used by the storefront header. */
export async function getWishlistCount(customerId: string): Promise<number> {
  const products = await getWishlist(customerId);
  return products.length;
}

/** Add a slug to the wishlist (idempotent). Unknown slugs are rejected. */
export async function addToWishlist(customerId: string, input: unknown): Promise<WishlistProduct[]> {
  const slug = parseSlug(input);

  const active = await findActiveProductBySlug(slug);
  if (!active) {
    throw new AppError('NOT_FOUND', 'Product not found.');
  }

  const slugs = await addWishlistSlug(customerId, slug);
  if (slugs === null) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return hydrateWishlistProducts(slugs);
}

/** Remove a slug from the wishlist (idempotent). */
export async function removeFromWishlist(
  customerId: string,
  input: unknown,
): Promise<WishlistProduct[]> {
  const slug = parseSlug(input);

  const slugs = await removeWishlistSlug(customerId, slug);
  if (slugs === null) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return hydrateWishlistProducts(slugs);
}
