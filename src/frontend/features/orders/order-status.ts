import type { OrderStatus } from '@/frontend/features/checkout/types';

export type { OrderStatus };

/** Every possible order status, in a stable order for filters. */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'processing',
  'ready_to_dispatch',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancellation_requested',
  'cancelled',
  'refunded',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready_to_dispatch: 'Ready to dispatch',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancellation_requested: 'Cancellation requested',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export type OrderStatusBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/** DaisyUI badge variant for each status (consumed via the shared `Badge`). */
export const ORDER_STATUS_BADGE: Record<OrderStatus, OrderStatusBadgeVariant> = {
  pending: 'info',
  processing: 'info',
  ready_to_dispatch: 'warning',
  dispatched: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancellation_requested: 'warning',
  cancelled: 'error',
  refunded: 'neutral',
};

const FULFILLMENT_FLOW: readonly OrderStatus[] = [
  'pending',
  'processing',
  'ready_to_dispatch',
  'dispatched',
  'out_for_delivery',
  'delivered',
];

/** Next status in the fulfillment flow, or null at the end (delivered). */
export function nextFulfillmentStatus(status: OrderStatus): OrderStatus | null {
  const index = FULFILLMENT_FLOW.indexOf(status);
  return index >= 0 && index < FULFILLMENT_FLOW.length - 1 ? FULFILLMENT_FLOW[index + 1] : null;
}
