import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cart.slice';
import wishlistReducer from './slices/wishlist.slice';

/**
 * Redux Toolkit store factory.
 *
 * A factory (instead of a module-level singleton) keeps the store out of
 * module scope so it is never shared across server-side requests. The client
 * `StoreProvider` creates one instance per browser app.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      wishlist: wishlistReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
