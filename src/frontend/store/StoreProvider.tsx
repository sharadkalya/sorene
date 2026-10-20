'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { persistCart } from './slices/cart.slice';

/**
 * Client-side Redux provider. Creates the store once per browser app and
 * exposes it to the tree. Persists cart changes to localStorage.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    const save = () => persistCart(store.getState().cart.items);
    save();
    return store.subscribe(save);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
