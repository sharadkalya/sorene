import Link from 'next/link';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import type { WishlistProductSummary } from '@/frontend/features/wishlist/types';

interface WishlistSectionProps {
  products: WishlistProductSummary[];
}

/** Wishlist preview card shown on the account page. */
export default function WishlistSection({ products }: WishlistSectionProps) {
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Wishlisted items</h2>
          <Button href="/wishlist" variant="ghost" size="sm">
            Manage
          </Button>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-base-content/60">No wishlisted items yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <Link
                key={product.slug}
                href={`/shop/products/${product.slug}`}
                className="flex items-center justify-between gap-4 py-2 border-b border-base-200 last:border-b-0 hover:text-primary"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-base-content/70">{formatPrice(product.price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
