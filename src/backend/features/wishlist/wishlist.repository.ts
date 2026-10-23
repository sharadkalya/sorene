import { getMongoConnection } from '@/backend/integrations/database/connection';
import CustomerModel from '@/backend/integrations/database/models/Customer';
import ProductModel, { type IProduct } from '@/backend/integrations/database/models/Product';
import type { WishlistProduct } from './wishlist.types';

/**
 * Persistence for wishlists.
 *
 * Wishlist storage lives on the Customer document (a plain array of product
 * slugs), so this repository owns the Customer model for that array — just
 * like the catalog repository owns Product. It also reads Product (read-only)
 * to hydrate slugs into displayable summaries; that cross-feature read is the
 * reason both models are imported here rather than re-implementing product
 * hydration in the wishlist feature.
 */

type ProductDoc = IProduct & { _id: { toString(): string } };

function toWishlistProduct(doc: ProductDoc): WishlistProduct {
  return {
    slug: doc.slug,
    name: doc.name,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice ?? null,
    image: doc.images?.[0] ?? '',
    status: doc.status,
  };
}

/** Raw slug list for a customer, or null when the customer is missing. */
export async function getCustomerWishlist(customerId: string): Promise<string[] | null> {
  await getMongoConnection();
  const doc = await CustomerModel.findById(customerId).select({ wishlist: 1 }).exec();
  if (!doc) return null;
  return (doc.wishlist ?? []).slice();
}

/** Idempotently add a slug and return the updated slug list. */
export async function addWishlistSlug(customerId: string, slug: string): Promise<string[] | null> {
  await getMongoConnection();
  const doc = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $addToSet: { wishlist: slug } },
    { new: true, runValidators: true },
  );
  if (!doc) return null;
  return (doc.wishlist ?? []).slice();
}

/** Remove a slug (no-op if absent) and return the updated slug list. */
export async function removeWishlistSlug(customerId: string, slug: string): Promise<string[] | null> {
  await getMongoConnection();
  const doc = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $pull: { wishlist: slug } },
    { new: true, runValidators: true },
  );
  if (!doc) return null;
  return (doc.wishlist ?? []).slice();
}

/** True when `slug` resolves to an active product. */
export async function findActiveProductBySlug(slug: string): Promise<boolean> {
  await getMongoConnection();
  const count = await ProductModel.countDocuments({ slug, status: 'active' }).exec();
  return count > 0;
}

/** Hydrate wishlist slugs into active product summaries, preserving order. */
export async function hydrateWishlistProducts(slugs: string[]): Promise<WishlistProduct[]> {
  if (slugs.length === 0) return [];

  await getMongoConnection();
  const docs = await ProductModel.find({ slug: { $in: slugs }, status: 'active' }).exec();

  const bySlug = new Map<string, WishlistProduct>();
  for (const doc of docs) {
    const product = toWishlistProduct(doc as ProductDoc);
    bySlug.set(product.slug, product);
  }

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is WishlistProduct => product !== undefined);
}
