'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Badge from '@/frontend/components/Badge';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import type { AdminOrderRecord } from '@/backend/features/orders/orders.types';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  nextFulfillmentStatus,
  type OrderStatus,
} from '@/frontend/features/orders/order-status';

const PROVIDER_LABELS: Record<string, string> = {
  razorpay: 'Razorpay',
};

/** Admin order detail: customer, items, totals, address, payment, and actions. */
export default function AdminOrderDetail({ order }: { order: AdminOrderRecord }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(nextStatus: OrderStatus) {
    setBusy(nextStatus);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        order?: AdminOrderRecord;
        error?: { code?: string; message?: string };
      };
      if (!response.ok || data.success === false || !data.order) {
        throw new Error(data.error?.message || 'We could not update this order. Please try again.');
      }
      setStatus(data.order.status);
      setNotice(`Order status updated to ${ORDER_STATUS_LABELS[data.order.status].toLowerCase()}.`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not update this order. Please try again.',
      );
    } finally {
      setBusy(null);
    }
  }

  const next = nextFulfillmentStatus(status);
  const canCancel =
    status === 'pending' || status === 'processing' || status === 'cancellation_requested';
  const canRefund = status === 'cancelled' && Boolean(order.payment);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
            ← Back to orders
          </Link>
          <h1 className="text-3xl font-bold mt-2">Order {order.number}</h1>
        </div>
        <Badge variant={ORDER_STATUS_BADGE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="card bg-base-100 border border-base-300">
            <div className="card-body gap-3">
              <h2 className="font-semibold">Items</h2>
              {order.items.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center gap-3 py-2 border-b border-base-200 last:border-b-0"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-base-300"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-snug">{item.name}</div>
                    <div className="text-xs text-base-content/60">
                      {formatPrice(item.price)} × {item.quantity}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="card bg-base-100 border border-base-300">
            <div className="card-body gap-2">
              <h2 className="font-semibold">Shipping address</h2>
              <p className="text-sm leading-relaxed">
                {order.address.fullName}
                <br />
                {order.address.line1}
                {order.address.line2 ? (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                ) : null}
                <br />
                {order.address.city}, {order.address.state} {order.address.pincode}
                <br />
                {order.address.phone}
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card bg-base-100 border border-base-300">
            <div className="card-body gap-2">
              <h2 className="font-semibold">Customer</h2>
              <div className="text-sm flex flex-col gap-1">
                <div className="font-medium">{order.customerName || 'Customer'}</div>
                <div className="text-base-content/60">{order.customerPhone}</div>
              </div>
            </div>
          </section>

          <section className="card bg-base-100 border border-base-300">
            <div className="card-body gap-2">
              <h2 className="font-semibold">Payment</h2>
              {order.payment ? (
                <dl className="text-sm flex flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-base-content/60">Method</dt>
                    <dd>{PROVIDER_LABELS[order.payment.provider] ?? order.payment.provider}</dd>
                  </div>
                  {order.payment.providerPaymentId && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-base-content/60">Payment ID</dt>
                      <dd className="text-right break-all">{order.payment.providerPaymentId}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-base-content/60">Amount</dt>
                    <dd>{formatPrice(order.payment.amountInPaise / 100)}</dd>
                  </div>
                  {order.payment.paidAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-base-content/60">Paid on</dt>
                      <dd>{new Date(order.payment.paidAt).toLocaleString('en-IN')}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-base-content/60">Payment details unavailable.</p>
              )}
            </div>
          </section>

          {(next || canCancel || canRefund) && (
            <section className="flex flex-col gap-2">
              {next && (
                <Button variant="primary" onClick={() => handleUpdate(next)} disabled={busy !== null}>
                  {busy === next ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    `Advance to ${ORDER_STATUS_LABELS[next]}`
                  )}
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="neutral"
                  onClick={() => handleUpdate('refunded')}
                  disabled={busy !== null}
                >
                  {busy === 'refunded' ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Mark refunded'
                  )}
                </Button>
              )}
              {canCancel && (
                <Button variant="error" onClick={() => handleUpdate('cancelled')} disabled={busy !== null}>
                  {busy === 'cancelled' ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Cancel order'
                  )}
                </Button>
              )}
            </section>
          )}

          {notice && <div className="alert alert-info text-sm">{notice}</div>}
          {error && <div className="alert alert-error text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
}
