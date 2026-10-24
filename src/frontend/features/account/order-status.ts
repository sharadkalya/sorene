/**
 * Order status metadata is centralized in `frontend/features/orders/order-status.ts`
 * so the account and admin views share one source of truth.
 */
export {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  ORDER_STATUSES,
  nextFulfillmentStatus,
} from '@/frontend/features/orders/order-status';
export type { OrderStatus } from '@/frontend/features/orders/order-status';
