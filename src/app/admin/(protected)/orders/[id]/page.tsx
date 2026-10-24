import { notFound } from 'next/navigation';
import { getAdminOrder } from '@/backend/features/orders/orders.service';
import AdminOrderDetail from '@/frontend/features/admin/AdminOrderDetail';

export const dynamic = 'force-dynamic';

/** Admin: view one order and act on it (complete/cancel). */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    notFound();
  }
  return <AdminOrderDetail order={order} />;
}
