'use client';

import { createContext, useContext } from 'react';

/**
 * Minimal storefront auth context. The server layout resolves the session
 * once per request and passes `isAuthenticated` + the server-side wishlist
 * count down; client components (ProductCard, ProductDetail) read it to decide
 * whether a wishlist toggle should hit the API or the guest Redux slice.
 */
export interface StorefrontAuthState {
  isAuthenticated: boolean;
  wishlistCount: number;
}

const StorefrontAuthContext = createContext<StorefrontAuthState>({
  isAuthenticated: false,
  wishlistCount: 0,
});

export function StorefrontAuthProvider({
  value,
  children,
}: {
  value: StorefrontAuthState;
  children: React.ReactNode;
}) {
  return <StorefrontAuthContext.Provider value={value}>{children}</StorefrontAuthContext.Provider>;
}

export function useStorefrontAuth(): StorefrontAuthState {
  return useContext(StorefrontAuthContext);
}
