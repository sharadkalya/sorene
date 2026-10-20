'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import {
  clearCart,
  removeItem,
  selectCartCount,
  selectCartItems,
  selectCartSubtotal,
  setQuantity,
} from '@/frontend/store/slices/cart.slice';
import { formatPrice } from './format';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-over cart summary with quantity controls and a checkout placeholder. */
export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();

  return (
    <div className={`drawer drawer-end ${open ? 'drawer-open' : ''}`}>
      <div className="drawer-content"></div>
      <div className="drawer-side z-50">
        <div
          className="absolute inset-0 bg-base-content/30"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="bg-base-100 h-full w-80 max-w-[90vw] shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
            <h2 className="font-semibold">Your Cart ({count})</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close cart">
              ✕
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-base-content/60">Your cart is empty.</p>
              <Link href="/shop" onClick={onClose} className="btn btn-primary btn-sm">
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.slug} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-base-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{item.name}</span>
                        <button
                          onClick={() => dispatch(removeItem(item.slug))}
                          className="text-base-content/40 hover:text-error"
                          aria-label={`Remove ${item.name}`}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="join">
                          <button
                            className="btn btn-xs btn-outline join-item"
                            onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity - 1 }))}
                          >
                            −
                          </button>
                          <span className="join-item px-2 py-1 text-sm">{item.quantity}</span>
                          <button
                            className="btn btn-xs btn-outline join-item"
                            onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity + 1 }))}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-base-300 p-4 space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/cart" onClick={onClose} className="btn btn-outline btn-sm">
                    View Cart
                  </Link>
                  <button
                    onClick={() => {
                      dispatch(clearCart());
                      onClose();
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Clear
                  </button>
                </div>
                <button className="btn btn-primary w-full" disabled title="Checkout is not available yet">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
