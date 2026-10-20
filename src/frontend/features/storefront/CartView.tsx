'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import {
  clearCart,
  removeItem,
  selectCartItems,
  selectCartSubtotal,
  setQuantity,
} from '@/frontend/store/slices/cart.slice';
import { formatPrice } from './format';

/** Full cart page with line items and a checkout placeholder. */
export default function CartView() {
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();
  const [notice, setNotice] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Your Cart</h1>
        <p className="text-base-content/60 mb-6">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Your Cart</h1>
        <button onClick={() => dispatch(clearCart())} className="btn btn-ghost btn-sm text-error">
          Clear cart
        </button>
      </div>

      {notice && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-info shadow-lg">
            <span>Checkout is not available yet in this preview.</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.slug}
            className="card bg-base-100 border border-base-300 card-side"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-l-xl"
            />
            <div className="card-body p-4 flex-row items-center justify-between">
              <div className="min-w-0">
                <Link
                  href={`/shop/products/${item.slug}`}
                  className="font-medium hover:text-primary leading-snug"
                >
                  {item.name}
                </Link>
                <div className="text-sm text-base-content/60 mt-1">{formatPrice(item.price)} each</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="join">
                  <button
                    className="btn btn-xs btn-outline join-item"
                    onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity - 1 }))}
                  >
                    −
                  </button>
                  <span className="join-item px-3 py-1 text-sm">{item.quantity}</span>
                  <button
                    className="btn btn-xs btn-outline join-item"
                    onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity + 1 }))}
                  >
                    +
                  </button>
                </div>
                <span className="font-semibold w-24 text-right">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => dispatch(removeItem(item.slug))}
                  className="btn btn-ghost btn-xs text-error"
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-base-200 mt-8">
        <div className="card-body">
          <div className="flex justify-between text-lg font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="text-sm text-base-content/60">Shipping and taxes calculated at checkout.</p>
          <div className="card-actions justify-end mt-4">
            <Link href="/shop" className="btn btn-outline">
              Continue Shopping
            </Link>
            <button onClick={() => setNotice(true)} className="btn btn-primary">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
