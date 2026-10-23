/** Hydrated product summary shown on wishlist surfaces. */
export interface WishlistProduct {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  status?: string;
}
