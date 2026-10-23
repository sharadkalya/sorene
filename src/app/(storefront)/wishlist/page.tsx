import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getWishlist } from '@/backend/features/wishlist/wishlist.service';
import WishlistView from '@/frontend/features/wishlist/WishlistView';
import type { WishlistProductSummary } from '@/frontend/features/wishlist/types';

export const dynamic = 'force-dynamic';

/** Storefront wishlist page: server-hydrated for customers, Redux for guests. */
export default async function WishlistPage() {
  const session = await getCurrentCustomer();

  let products: WishlistProductSummary[] | null = null;
  if (session) {
    try {
      products = await getWishlist(session.customerId);
    } catch {
      // Stale session for a deleted customer: fall back to the guest view.
      products = null;
    }
  }

  if (products !== null) {
    return <WishlistView products={products} isAuthenticated />;
  }

  return <WishlistView />;
}
