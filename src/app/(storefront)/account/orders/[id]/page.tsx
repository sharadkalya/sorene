import { notFound } from 'next/navigation';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getCustomerOrder } from '@/backend/features/orders/orders.service';
import OrderDetails from '@/frontend/features/account/OrderDetails';

export const dynamic = 'force-dynamic';

/** Storefront account: one of the authenticated customer's orders. */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentCustomer();
  const order = session ? await getCustomerOrder(session.customerId, id) : null;

  if (!order) {
    notFound();
  }

  return <OrderDetails order={order} />;
}
