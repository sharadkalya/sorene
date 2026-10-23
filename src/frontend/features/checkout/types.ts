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

/** Mirrors the order returned by `POST /api/customer/orders`. */
export interface Order {
  id: string;
  number: string;
  status: 'placed';
  subtotal: number;
  total: number;
  createdAt: string;
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
}
