'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import type { Order } from '@/frontend/features/checkout/types';
import OrderStatusBadge from './OrderStatusBadge';
import SignedOut from './SignedOut';

interface OrdersListProps {
  /** Null means the visitor is signed out. */
  orders: Order[] | null;
}

/** Order history list. Each row links to the order detail page. */
export default function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();

  if (!orders) {
    return <SignedOut onSignedIn={() => router.refresh()} />;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Your orders</h1>
        <p className="text-base-content/60 mb-6">You have no orders yet.</p>
        <Button href="/shop" variant="primary">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Your orders</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="card bg-base-100 border border-base-300 hover:border-primary"
          >
            <div className="card-body gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">Order {order.number}</div>
                  <div className="text-xs text-base-content/60">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-base-content/70">
                  {order.items.reduce((count, item) => count + item.quantity, 0)} item(s)
                </span>
                <span className="font-semibold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
