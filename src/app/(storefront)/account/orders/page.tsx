import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { listCustomerOrders } from '@/backend/features/orders/orders.service';
import OrdersList from '@/frontend/features/account/OrdersList';

export const dynamic = 'force-dynamic';

/** Storefront account: the authenticated customer's order history. */
export default async function OrdersPage() {
  const session = await getCurrentCustomer();
  const orders = session ? await listCustomerOrders(session.customerId) : null;

  return <OrdersList orders={orders} />;
}
