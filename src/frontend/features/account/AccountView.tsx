'use client';

import { useRouter } from 'next/navigation';
import SignedOut from './SignedOut';
import ProfileSection from './ProfileSection';
import PaymentMethodsSection from './PaymentMethodsSection';
import AddressesSection from './AddressesSection';
import WishlistSection from './WishlistSection';
import LogoutSection from './LogoutSection';
import type { AccountCustomer } from './account.types';
import type { WishlistProductSummary } from '@/frontend/features/wishlist/types';

interface AccountViewProps {
  customer: AccountCustomer | null;
  wishlistProducts: WishlistProductSummary[];
}

/** Account page content: sign-in prompt when logged out, profile when in. */
export default function AccountView({ customer, wishlistProducts }: AccountViewProps) {
  const router = useRouter();

  if (!customer) {
    return <SignedOut onSignedIn={() => router.refresh()} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your account</h1>
      <ProfileSection customer={customer} />
      <PaymentMethodsSection />
      <AddressesSection addresses={customer.addresses} />
      <WishlistSection products={wishlistProducts} />
      <LogoutSection />
    </div>
  );
}
