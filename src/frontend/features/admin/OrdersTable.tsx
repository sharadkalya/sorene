'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Badge from '@/frontend/components/Badge';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import type { AdminOrderRecord } from '@/backend/features/orders/orders.types';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  RETURN_STATUS_BADGE,
  RETURN_STATUS_LABELS,
  type OrderStatus,
} from '@/frontend/features/orders/order-status';

const FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  ...ORDER_STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABELS[status] })),
];

interface OrdersTableProps {
  orders: AdminOrderRecord[];
  total: number;
  page: number;
  totalPages: number;
  currentStatus: OrderStatus | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Paginated, filterable admin order list. */
export default function OrdersTable({
  orders,
  total,
  page,
  totalPages,
  currentStatus,
}: OrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(next: { status?: OrderStatus | null; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status) {
        params.set('status', next.status);
      } else {
        params.delete('status');
      }
      params.delete('page');
    }
    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set('page', String(next.page));
      } else {
        params.delete('page');
      }
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-base-content/70">
            {total} order{total === 1 ? '' : 's'}, newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => {
            const active = currentStatus === filter.value;
            return (
              <Button
                key={filter.label}
                size="sm"
                variant={active ? 'primary' : 'outline'}
                onClick={() => navigate({ status: filter.value })}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-16 text-center gap-2">
            <p className="text-base-content/60">
              {currentStatus ? 'No orders match this filter.' : 'No orders yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto p-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr
                      key={order.id}
                      className="hover cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <td className="font-semibold">{order.number}</td>
                      <td className="text-sm text-base-content/70">{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="font-medium">{order.customerName || 'Customer'}</div>
                        <div className="text-sm text-base-content/70">{order.customerPhone}</div>
                      </td>
                      <td>
                        <Badge variant="ghost" size="sm">
                          {itemCount} item{itemCount === 1 ? '' : 's'}
                        </Badge>
                      </td>
                      <td className="font-semibold">{formatPrice(order.total)}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge variant={ORDER_STATUS_BADGE[order.status]} size="sm">
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                          {order.return && (
                            <Badge variant={RETURN_STATUS_BADGE[order.return.status]} size="sm">
                              {RETURN_STATUS_LABELS[order.return.status]}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ page: page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-base-content/70">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigate({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
