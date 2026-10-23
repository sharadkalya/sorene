'use client';

import Link from 'next/link';
import { useAppDispatch } from '@/frontend/store/hooks';
import { addItem } from '@/frontend/store/slices/cart.slice';
import Button from '@/frontend/components/Button';
import { useWishlistToggle } from '@/frontend/features/wishlist/useWishlistToggle';
import { formatPrice } from './format';

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
}

interface ProductCardProps {
  product: StorefrontProduct;
}

/** Responsive product card with quick add-to-cart. */
export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const image = product.images[0] ?? '';
  const { wishlisted, toggle, busy } = useWishlistToggle({
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image,
  });

  const handleAdd = () => {
    dispatch(
      addItem({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image,
      }),
    );
  };

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-base-200">
        <Link href={`/shop/products/${product.slug}`} className="block w-full h-full">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base-content/30">No image</div>
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`btn btn-ghost btn-circle btn-sm absolute top-2 right-2 bg-base-100/80 ${
            wishlisted ? 'text-primary' : 'text-base-content/60'
          }`}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          {busy ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill={wishlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="card-body p-4">
        <Link href={`/shop/products/${product.slug}`} className="font-medium hover:text-primary leading-snug">
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <span className="text-base-content/50 line-through text-sm">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <Button onClick={handleAdd} variant="outline" size="sm" className="mt-1">
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
