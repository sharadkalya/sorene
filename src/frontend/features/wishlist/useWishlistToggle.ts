'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import { selectWishlistItems, toggleItem } from '@/frontend/store/slices/wishlist.slice';
import { addWishlistItem, removeWishlistItem } from './api';
import { useStorefrontAuth } from './StorefrontAuthContext';
import type { WishlistProductSummary } from './types';

/**
 * Shared wishlist toggle. Guests toggle the Redux slice; signed-in customers
 * call the wishlist API and refresh the server-rendered header count. For
 * signed-in users the heart starts unfilled unless `initialWishlisted` is set
 * (per-product membership is not available server-side on listing pages).
 */
export function useWishlistToggle(product: WishlistProductSummary, initialWishlisted = false) {
  const { isAuthenticated } = useStorefrontAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const guestItems = useAppSelector(selectWishlistItems);
  const [serverWishlisted, setServerWishlisted] = useState(initialWishlisted);
  const [busy, setBusy] = useState(false);

  const wishlisted = isAuthenticated
    ? serverWishlisted
    : guestItems.some((item) => item.slug === product.slug);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isAuthenticated) {
        const next = !serverWishlisted;
        setServerWishlisted(next);
        if (next) {
          await addWishlistItem(product.slug);
        } else {
          await removeWishlistItem(product.slug);
        }
        router.refresh();
      } else {
        dispatch(toggleItem(product));
      }
    } catch {
      if (isAuthenticated) {
        setServerWishlisted((current) => !current);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, dispatch, isAuthenticated, product, router, serverWishlisted]);

  return { wishlisted, toggle, busy };
}
