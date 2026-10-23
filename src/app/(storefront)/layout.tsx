import StoreHeader from '@/frontend/features/storefront/StoreHeader';
import {
  StorefrontAuthProvider,
} from '@/frontend/features/wishlist/StorefrontAuthContext';
import WishlistPersistence from '@/frontend/features/wishlist/WishlistPersistence';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getWishlistCount } from '@/backend/features/wishlist/wishlist.service';

/** Shared chrome for all storefront pages (shop, cart, account, wishlist). */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentCustomer();
  const isAuthenticated = Boolean(session);

  let wishlistCount = 0;
  if (session) {
    try {
      wishlistCount = await getWishlistCount(session.customerId);
    } catch {
      // A stale session pointing at a deleted customer shouldn't take down
      // the storefront chrome — fall back to an empty count.
      wishlistCount = 0;
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      <StorefrontAuthProvider value={{ isAuthenticated, wishlistCount }}>
        <StoreHeader isAuthenticated={isAuthenticated} wishlistCount={wishlistCount} />
        <WishlistPersistence />
        <main>{children}</main>
      </StorefrontAuthProvider>
    </div>
  );
}
