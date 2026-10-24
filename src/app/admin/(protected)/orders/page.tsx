import { listAdminOrders } from '@/backend/features/orders/orders.service';
import { ORDER_STATUSES, type OrderStatus } from '@/backend/features/orders/orders.types';
import OrdersTable from '@/frontend/features/admin/OrdersTable';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: ReadonlySet<string> = new Set(ORDER_STATUSES);

interface AdminOrdersSearchParams {
  status?: string;
  page?: string;
  limit?: string;
}

/** Admin: view all orders, filterable by status and paginated (newest first). */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<AdminOrdersSearchParams>;
}) {
  const params = await searchParams;

  const status =
    params.status && VALID_STATUSES.has(params.status)
      ? (params.status as OrderStatus)
      : undefined;

  const rawPage = Number(params.page ?? '1');
  const rawLimit = Number(params.limit ?? '20');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;

  const result = await listAdminOrders({ status, page, limit });

  return (
    <OrdersTable
      orders={result.orders}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      currentStatus={status ?? null}
    />
  );
}
