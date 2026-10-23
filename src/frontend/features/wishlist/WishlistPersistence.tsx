'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/frontend/store/hooks';
import { persistWishlist } from '@/frontend/store/slices/wishlist.slice';

/**
 * Persists the guest wishlist slice to localStorage on every change. Rendered
 * by the storefront layout (the root StoreProvider is shared app-wide and owned
 * elsewhere), mirroring the cart persistence there.
 */
export default function WishlistPersistence() {
  const store = useAppStore();

  useEffect(() => {
    const save = () => persistWishlist(store.getState().wishlist.items);
    save();
    return store.subscribe(save);
  }, [store]);

  return null;
}
