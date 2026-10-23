'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import { removeItem, selectWishlistItems } from '@/frontend/store/slices/wishlist.slice';
import Button from '@/frontend/components/Button';
import { removeWishlistItem } from './api';
import WishlistItemCard from './WishlistItemCard';
import type { WishlistProductSummary } from './types';

interface WishlistViewProps {
  /** Server-hydrated products for a signed-in customer. */
  products?: WishlistProductSummary[];
  isAuthenticated?: boolean;
}

/**
 * Wishlist page content. Signed-in customers start from the server-rendered
 * list and remove via the API; guests read the Redux slice (localStorage).
 */
export default function WishlistView({ products = [], isAuthenticated = false }: WishlistViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isClient = useIsClient();
  const guestItems = useAppSelector(selectWishlistItems);
  const [serverItems, setServerItems] = useState<WishlistProductSummary[]>(products);
  const [removing, setRemoving] = useState<string | null>(null);

  // Guest items come from localStorage, so they're only available after
  // hydration. Render an inert placeholder during SSR to avoid a mismatch.
  if (!isAuthenticated && !isClient) {
    return <div className="max-w-3xl mx-auto px-4 py-8" aria-hidden="true" />;
  }

  const items = isAuthenticated ? serverItems : guestItems;

  const handleRemove = async (slug: string) => {
    setRemoving(slug);
    try {
      if (isAuthenticated) {
        const updated = await removeWishlistItem(slug);
        setServerItems(updated);
        router.refresh();
      } else {
        dispatch(removeItem(slug));
      }
    } finally {
      setRemoving(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-16 gap-3">
            <h1 className="text-2xl font-semibold">Your wishlist is empty</h1>
            <p className="text-base-content/60 max-w-md">
              Tap the heart on any product to save it here for later.
            </p>
            <Button href="/shop" variant="primary" size="sm" className="mt-2">
              Browse the collection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Wishlist</h1>
      <div className="flex flex-col gap-3">
        {items.map((product) => (
          <WishlistItemCard
            key={product.slug}
            product={product}
            onRemove={handleRemove}
            removing={removing === product.slug}
          />
        ))}
      </div>
      <div className="mt-6">
        <Button href="/shop" variant="outline" size="sm">
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
