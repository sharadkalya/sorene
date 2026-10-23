'use client';

import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';
import { formatPrice } from '@/frontend/features/storefront/format';

interface OrderItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
}

interface AdminOrder {
  id: string;
  number: string;
  status: 'placed';
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  customerId: string;
  customerPhone: string;
  customerName?: string;
}

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-base-content/70">All placed orders, newest first.</p>
        </div>
        <Button onClick={() => router.refresh()} variant="primary">
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-16">
            <p className="text-base-content/60">No orders yet.</p>
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
                  const summary = order.items
                    .map((item) => `${item.name} ×${item.quantity}`)
                    .join(', ');

                  return (
                    <tr key={order.id} className="hover">
                      <td className="font-semibold">{order.number}</td>
                      <td className="text-sm text-base-content/70">{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="font-medium">{order.customerName || 'Customer'}</div>
                        <div className="text-sm text-base-content/70">{order.customerPhone}</div>
                      </td>
                      <td>
                        <Badge variant="ghost">{itemCount} item{itemCount === 1 ? '' : 's'}</Badge>
                        <div className="text-sm text-base-content/70 max-w-64 truncate">{summary}</div>
                      </td>
                      <td className="font-semibold">{formatPrice(order.total)}</td>
                      <td>
                        <Badge variant="success" className="capitalize">{order.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
