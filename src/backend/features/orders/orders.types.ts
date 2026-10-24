/** API response shapes for the orders feature (no raw DB fields). */

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'ready_to_dispatch',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancellation_requested',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItemRecord {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressRecord {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderPaymentRecord {
  provider: string;
  providerPaymentId?: string;
  amountInPaise: number;
  currency: string;
  paidAt?: string;
}

/** Safe customer-facing order shape — never includes the customer id/phone. */
export interface OrderRecord {
  id: string;
  number: string;
  status: OrderStatus;
  items: OrderItemRecord[];
  subtotal: number;
  total: number;
  createdAt: string;
  address: OrderAddressRecord;
  payment?: OrderPaymentRecord;
}

/** Admin shape that adds the owning customer identity for support/ops. */
export interface AdminOrderRecord extends OrderRecord {
  customerId: string;
  customerPhone: string;
  customerName?: string;
}
