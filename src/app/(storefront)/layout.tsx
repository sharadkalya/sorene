import StoreHeader from '@/frontend/features/storefront/StoreHeader';

/** Shared chrome for all storefront pages (shop, cart). */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100">
      <StoreHeader />
      <main>{children}</main>
    </div>
  );
}
