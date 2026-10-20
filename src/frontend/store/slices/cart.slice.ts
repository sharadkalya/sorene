import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Cart is shared client state for the storefront. Items are keyed by product
 * slug; adding an existing item increments its quantity. Persisted to
 * localStorage so a refresh keeps the cart (guest checkout for now).
 */

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = 'sorvene-cart';

function loadPersistedItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

const initialState: CartState = { items: loadPersistedItems() };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) {
      const { slug, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.slug === slug);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          slug: action.payload.slug,
          name: action.payload.name,
          price: action.payload.price,
          image: action.payload.image,
          quantity,
        });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.slug !== action.payload);
    },
    setQuantity(state, action: PayloadAction<{ slug: string; quantity: number }>) {
      const item = state.items.find((entry) => entry.slug === action.payload.slug);
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, setQuantity, clearCart } = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }): CartItem[] => state.cart.items;
export const selectCartCount = (state: { cart: CartState }): number =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }): number =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

export function persistCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures (private mode, quota) — cart still works in memory.
  }
}

export default cartSlice.reducer;
