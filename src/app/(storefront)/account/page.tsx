import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getCustomerOrNull } from '@/backend/features/customer/customer.service';
import { getWishlist } from '@/backend/features/wishlist/wishlist.service';
import AccountView from '@/frontend/features/account/AccountView';

export const dynamic = 'force-dynamic';

/** Storefront account page: profile, addresses, payment methods, wishlist. */
export default async function AccountPage() {
  const session = await getCurrentCustomer();
  const customer = session ? await getCustomerOrNull(session.customerId) : null;
  const wishlistProducts = session && customer ? await getWishlist(session.customerId) : [];

  return <AccountView customer={customer} wishlistProducts={wishlistProducts} />;
}
