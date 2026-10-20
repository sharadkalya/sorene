'use client';

import Link from 'next/link';
import { useAppDispatch } from '@/frontend/store/hooks';
import { addItem } from '@/frontend/store/slices/cart.slice';
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
      <Link href={`/shop/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-base-200">
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
        <button onClick={handleAdd} className="btn btn-outline btn-sm mt-1">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
