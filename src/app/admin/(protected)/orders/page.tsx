import { listAdminOrders } from '@/backend/features/orders/orders.service';
import OrdersTable from '@/frontend/features/admin/OrdersTable';

export const dynamic = 'force-dynamic';

/** Admin: view all placed orders. */
export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();
  return <OrdersTable orders={orders} />;
}
