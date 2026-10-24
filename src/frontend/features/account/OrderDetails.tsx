'use client';

import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/frontend/components/Badge';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import { requestOrderCancellation, requestReturn } from '@/frontend/features/checkout/api';
import type { Order, ReturnStatus } from '@/frontend/features/checkout/types';
import { RETURN_STATUS_BADGE, RETURN_STATUS_LABELS } from '@/frontend/features/orders/order-status';
import OrderStatusBadge from './OrderStatusBadge';

const PROVIDER_LABELS: Record<string, string> = {
  razorpay: 'Razorpay',
};

/** Order detail page: items, price, payment, address, and cancel action. */
export default function OrderDetails({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnStatus, setReturnStatus] = useState<ReturnStatus | null>(order.return?.status ?? null);
  const [returnBusy, setReturnBusy] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  async function handleReturnRequest() {
    setReturnBusy(true);
    setReturnError(null);
    try {
      const updated = await requestReturn(order.id);
      setReturnStatus(updated.return?.status ?? 'return_requested');
    } catch (err) {
      setReturnError(
        err instanceof Error ? err.message : 'We could not request a return. Please try again.',
      );
    } finally {
      setReturnBusy(false);
    }
  }

  async function handleCancelRequest() {
    setBusy(true);
    setError(null);
    try {
      const updated = await requestOrderCancellation(order.id);
      setStatus(updated.status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not request cancellation. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-semibold">Order details</h1>
        <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
          ← Back to orders
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <section className="card bg-base-100 border border-base-300">
          <div className="card-body gap-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">Order {order.number}</h2>
              <OrderStatusBadge status={status} />
            </div>
            <p className="text-xs text-base-content/60">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </section>

        <section className="card bg-base-100 border border-base-300">
          <div className="card-body gap-3">
            <h2 className="font-semibold">Items</h2>
            {order.items.map((item) => (
              <Link
                key={item.slug}
                href={`/shop/products/${item.slug}`}
                className="flex items-center gap-3 py-2 border-b border-base-200 last:border-b-0 hover:text-primary"
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
              </Link>
            ))}
            <div className="flex justify-between font-semibold pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
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

        <section className="card bg-base-100 border border-base-300">
          <div className="card-body gap-2">
            <h2 className="font-semibold">Shipping to</h2>
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

        {(status === 'pending' || status === 'processing') && (
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-base-content/60">
              Cancellation is subject to confirmation by our team.
            </p>
            <Button onClick={handleCancelRequest} variant="outline" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Cancel order'}
            </Button>
          </section>
        )}

        {returnStatus ? (
          <section className="card bg-base-100 border border-base-300">
            <div className="card-body gap-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">Return</h2>
                <Badge variant={RETURN_STATUS_BADGE[returnStatus]} size="sm">
                  {RETURN_STATUS_LABELS[returnStatus]}
                </Badge>
              </div>
              {order.return?.adminNote && (
                <p className="text-sm text-base-content/70">
                  Note from our team: {order.return.adminNote}
                </p>
              )}
            </div>
          </section>
        ) : order.returnableUntil ? (
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-base-content/60">
              Return this order by{' '}
              {new Date(order.returnableUntil).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              .
            </p>
            <Button onClick={handleReturnRequest} variant="outline" disabled={returnBusy}>
              {returnBusy ? <span className="loading loading-spinner loading-sm" /> : 'Return order'}
            </Button>
          </section>
        ) : null}

        {status === 'cancellation_requested' && (
          <div className="alert alert-info text-sm">
            Cancellation requested — our team will review and confirm it.
          </div>
        )}

        {error && <div className="alert alert-error text-sm">{error}</div>}
        {returnError && <div className="alert alert-error text-sm">{returnError}</div>}
      </div>
    </div>
  );
}
