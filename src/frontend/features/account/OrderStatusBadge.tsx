import Badge from '@/frontend/components/Badge';
import type { OrderStatus } from '@/frontend/features/checkout/types';
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '@/frontend/features/orders/order-status';

/** Small DaisyUI badge for an order's status. */
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_BADGE[status]} size="sm">
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
