import type { OrderStatus, ReturnStatus } from '@/frontend/features/checkout/types';

export type { OrderStatus, ReturnStatus };

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

export const RETURN_STATUSES: readonly ReturnStatus[] = [
  'return_requested',
  'return_approved',
  'return_rejected',
  'pickup_scheduled',
  'picked_up',
  'returned',
  'refunded',
];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  return_requested: 'Return requested',
  return_approved: 'Return approved',
  return_rejected: 'Return rejected',
  pickup_scheduled: 'Pickup scheduled',
  picked_up: 'Picked up',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const RETURN_STATUS_BADGE: Record<ReturnStatus, OrderStatusBadgeVariant> = {
  return_requested: 'warning',
  return_approved: 'info',
  return_rejected: 'error',
  pickup_scheduled: 'info',
  picked_up: 'info',
  returned: 'success',
  refunded: 'neutral',
};

const RETURN_FLOW: readonly ReturnStatus[] = [
  'return_approved',
  'pickup_scheduled',
  'picked_up',
  'returned',
  'refunded',
];

/** Next return status after approval, or null at the end/decision points. */
export function nextReturnStatus(status: ReturnStatus): ReturnStatus | null {
  const index = RETURN_FLOW.indexOf(status);
  return index >= 0 && index < RETURN_FLOW.length - 1 ? RETURN_FLOW[index + 1] : null;
}
