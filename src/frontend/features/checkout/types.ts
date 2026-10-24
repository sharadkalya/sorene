/** Client-facing shapes mirroring the customer API responses. */

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
}

/** Mirrors the order returned by the customer orders API. */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancellation_requested'
  | 'cancelled'
  | 'refunded';

export interface OrderPayment {
  provider: string;
  providerPaymentId?: string;
  amountInPaise: number;
  currency: string;
  paidAt?: string;
}

export type ReturnStatus =
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'returned'
  | 'refunded';

export interface OrderReturn {
  status: ReturnStatus;
  requestedAt: string;
  adminNote?: string;
  decidedAt?: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  address: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  payment?: OrderPayment;
  return?: OrderReturn;
  /** ISO deadline for requesting a return (server-computed); absent when not returnable. */
  returnableUntil?: string;
}

/** Mirrors the payment returned by `POST /api/payments/create-order`. */
export interface PaymentCreateResult {
  provider: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: string;
  publicKey: string;
}

/** Mirrors the result of `POST /api/payments/verify`. */
export interface PaymentVerifyResult {
  verified: boolean;
  status: 'paid';
  orderId: string;
  orderNumber: string;
}
