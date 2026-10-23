import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Guest wishlist is shared client state for the storefront, mirroring the cart
 * slice. Items are keyed by product slug and persist to localStorage so a
 * signed-out visitor keeps their wishlist across refreshes. Signed-in visitors
 * use the server-side wishlist (see `src/backend/features/wishlist`).
 */

export interface WishlistItem {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
}

export interface WishlistState {
  items: WishlistItem[];
}

const STORAGE_KEY = 'sorvene-wishlist';

function loadPersistedItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

const initialState: WishlistState = { items: loadPersistedItems() };

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleItem(state, action: PayloadAction<WishlistItem>) {
      const existing = state.items.find((item) => item.slug === action.payload.slug);
      if (existing) {
        state.items = state.items.filter((item) => item.slug !== action.payload.slug);
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.slug !== action.payload);
    },
    clearWishlist(state) {
      state.items = [];
    },
  },
});

export const { toggleItem, removeItem, clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems = (state: { wishlist: WishlistState }): WishlistItem[] =>
  state.wishlist.items;
export const selectWishlistCount = (state: { wishlist: WishlistState }): number =>
  state.wishlist.items.length;

export function persistWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures (private mode, quota) — wishlist still works in memory.
  }
}

export default wishlistSlice.reducer;
