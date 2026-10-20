import { describe, expect, it } from 'vitest';
import { makeStore } from './store';
import {
  addItem,
  clearCart,
  removeItem,
  selectCartCount,
  selectCartSubtotal,
  setQuantity,
} from './slices/cart.slice';

describe('cart slice', () => {
  it('adds new items and increments existing ones', () => {
    const store = makeStore();
    store.dispatch(addItem({ slug: 'bag-1', name: 'Bag One', price: 100, image: '' }));
    store.dispatch(addItem({ slug: 'bag-1', name: 'Bag One', price: 100, image: '' }));

    const state = store.getState().cart;
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(2);
  });

  it('computes count and subtotal', () => {
    const store = makeStore();
    store.dispatch(addItem({ slug: 'a', name: 'A', price: 10, image: '' }));
    store.dispatch(addItem({ slug: 'b', name: 'B', price: 25, image: '', quantity: 2 }));

    expect(selectCartCount(store.getState())).toBe(3);
    expect(selectCartSubtotal(store.getState())).toBe(60);
  });

  it('updates quantity, clamps to a minimum of 1, removes, and clears', () => {
    const store = makeStore();
    store.dispatch(addItem({ slug: 'a', name: 'A', price: 10, image: '' }));

    store.dispatch(setQuantity({ slug: 'a', quantity: 0 }));
    expect(store.getState().cart.items[0]?.quantity).toBe(1);

    store.dispatch(setQuantity({ slug: 'a', quantity: 4 }));
    expect(store.getState().cart.items[0]?.quantity).toBe(4);

    store.dispatch(removeItem('a'));
    expect(store.getState().cart.items).toHaveLength(0);

    store.dispatch(addItem({ slug: 'a', name: 'A', price: 10, image: '' }));
    store.dispatch(clearCart());
    expect(store.getState().cart.items).toHaveLength(0);
  });
});
