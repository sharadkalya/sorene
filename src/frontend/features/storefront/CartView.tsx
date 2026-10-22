'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import Button from '@/frontend/components/Button';
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
  const isClient = useIsClient();

  if (!isClient) {
    return <div className="max-w-4xl mx-auto px-4 py-8" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Your Cart</h1>
        <p className="text-base-content/60 mb-6">Your cart is empty.</p>
        <Button href="/shop" variant="primary">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Your Cart</h1>
        <Button onClick={() => dispatch(clearCart())} variant="ghost" size="sm" className="text-error">
          Clear cart
        </Button>
      </div>

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
                  <Button
                    size="xs"
                    variant="outline"
                    className="join-item"
                    onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity - 1 }))}
                  >
                    −
                  </Button>
                  <span className="join-item px-3 py-1 text-sm">{item.quantity}</span>
                  <Button
                    size="xs"
                    variant="outline"
                    className="join-item"
                    onClick={() => dispatch(setQuantity({ slug: item.slug, quantity: item.quantity + 1 }))}
                  >
                    +
                  </Button>
                </div>
                <span className="font-semibold w-24 text-right">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <Button
                  onClick={() => dispatch(removeItem(item.slug))}
                  variant="ghost"
                  size="xs"
                  className="text-error"
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </Button>
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
            <Button href="/shop" variant="outline">
              Continue Shopping
            </Button>
            <Button href="/checkout" variant="primary">
              Proceed to Buy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
