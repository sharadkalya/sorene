'use client';

import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import Button from '@/frontend/components/Button';
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
            <Button onClick={onClose} variant="ghost" size="sm" shape="circle" aria-label="Close cart">
              ✕
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-base-content/60">Your cart is empty.</p>
              <Button href="/shop" onClick={onClose} variant="primary" size="sm">
                Start Shopping
              </Button>
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
                          <Button
                            size="xs"
                            variant="outline"
                            className="join-item"
                            onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity - 1 }))}
                          >
                            −
                          </Button>
                          <span className="join-item px-2 py-1 text-sm">{item.quantity}</span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="join-item"
                            onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity + 1 }))}
                          >
                            +
                          </Button>
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
                  <Button href="/cart" onClick={onClose} variant="outline" size="sm">
                    View Cart
                  </Button>
                  <Button
                    onClick={() => {
                      dispatch(clearCart());
                      onClose();
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
                <Button variant="primary" className="w-full" disabled title="Checkout is not available yet">
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
