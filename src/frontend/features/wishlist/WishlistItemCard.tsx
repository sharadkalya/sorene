'use client';

import Link from 'next/link';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import type { WishlistProductSummary } from './types';

interface WishlistItemCardProps {
  product: WishlistProductSummary;
  onRemove: (slug: string) => void;
  removing?: boolean;
}

/** A wishlist row with image, name, price, and a remove control. */
export default function WishlistItemCard({ product, onRemove, removing = false }: WishlistItemCardProps) {
  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      <div className="card-body p-4 gap-3">
        <div className="flex items-center gap-4">
          <Link
            href={`/shop/products/${product.slug}`}
            className="block w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-base-200 border border-base-300"
            aria-label={`View ${product.name}`}
          >
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base-content/30">No image</div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/shop/products/${product.slug}`}
              className="font-medium hover:text-primary leading-snug"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold">{formatPrice(product.price)}</span>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <span className="text-base-content/50 line-through text-sm">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={() => onRemove(product.slug)}
            variant="ghost"
            shape="circle"
            disabled={removing}
            aria-label={`Remove ${product.name} from wishlist`}
          >
            {removing ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
