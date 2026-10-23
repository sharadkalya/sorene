'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/frontend/components/Button';
import { useAppDispatch, useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import { clearCart, selectCartItems, selectCartSubtotal } from '@/frontend/store/slices/cart.slice';
import { formatPrice } from '@/frontend/features/storefront/format';
import { placeOrder } from './api';
import type { Address, Order } from './types';

interface OrderScreenProps {
  deliveryAddress: Address | null;
  deliveryAddressId: string | null;
}

/** Order review screen. Places the order against the selected delivery address. */
export default function OrderScreen({ deliveryAddress, deliveryAddressId }: OrderScreenProps) {
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const isClient = useIsClient();

  if (!isClient) {
    return <div className="max-w-2xl mx-auto px-4 py-8" aria-hidden="true" />;
  }

  async function handlePlaceOrder() {
    if (!deliveryAddressId) {
      setError('Please choose a delivery address to continue.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const placed = await placeOrder(
        deliveryAddressId,
        items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      );
      setOrder(placed);
      dispatch(clearCart());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not place your order. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Order placed</h1>
        <p className="text-base-content/60 mb-2">
          Order {order.number} — {formatPrice(order.total)}
        </p>
        <p className="text-base-content/60 mb-6">Order placed — we&apos;ll contact you to confirm delivery</p>
        <Button href="/shop" variant="primary">
          Continue shopping
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Review your order</h1>
        <p className="text-base-content/60 mb-6">Your cart is empty.</p>
        <Button href="/shop" variant="primary">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Review your order</h1>
        <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
          ← Back to cart
        </Link>
      </div>

      {!deliveryAddress && (
        <div className="alert alert-warning mb-6">
          <span>We could not find your delivery address. Please go back and choose one.</span>
        </div>
      )}

      <div className="card bg-base-100 border border-base-300 mb-6">
        <div className="card-body gap-3">
          <h2 className="font-semibold">Items</h2>
          {items.map((item) => (
            <div key={item.slug} className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-lg border border-base-300"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-snug">{item.name}</div>
                <div className="text-xs text-base-content/60">Qty {item.quantity}</div>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {deliveryAddress && (
        <div className="card bg-base-100 border border-base-300 mb-6">
          <div className="card-body gap-2">
            <h2 className="font-semibold">Deliver to</h2>
            <p className="text-sm leading-relaxed">
              {deliveryAddress.fullName}
              <br />
              {deliveryAddress.line1}
              {deliveryAddress.line2 ? (
                <>
                  <br />
                  {deliveryAddress.line2}
                </>
              ) : null}
              <br />
              {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.pincode}
              <br />
              {deliveryAddress.phone}
            </p>
          </div>
        </div>
      )}

      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="text-sm text-base-content/60">Shipping is calculated at checkout. Taxes may apply.</p>
          {error && <div className="alert alert-error text-sm mt-4">{error}</div>}
          <div className="card-actions justify-end mt-4">
            <Button onClick={handlePlaceOrder} variant="primary" disabled={!deliveryAddress || busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Place order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
