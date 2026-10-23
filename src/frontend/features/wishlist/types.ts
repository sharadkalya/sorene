/** Product summary used by guest wishlist state and wishlist UI. */
export interface WishlistProductSummary {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
}
