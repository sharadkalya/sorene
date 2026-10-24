import type {
  Address,
  AddressInput,
  Customer,
  Order,
  PaymentCreateResult,
  PaymentVerifyResult,
} from './types';

interface ApiEnvelope {
  success?: boolean;
  error?: { code?: string; message?: string };
}

async function readJson<T = Record<string, unknown>>(response: Response): Promise<T & ApiEnvelope> {
  try {
    return (await response.json()) as T & ApiEnvelope;
  } catch {
    return {} as T & ApiEnvelope;
  }
}

/** Request an OTP be sent to `phone` over WhatsApp. */
export async function requestOtp(phone: string): Promise<void> {
  const response = await fetch('/api/customer/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await readJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error?.message || 'We could not send a code right now. Please try again.');
  }
}

/** Verify the WhatsApp-delivered OTP and receive the authenticated customer. */
export async function verifyOtp(phone: string, code: string): Promise<Customer> {
  const response = await fetch('/api/customer/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await readJson<{ customer: Customer }>(response);
  if (!response.ok || data.success === false || !data.customer) {
    throw new Error(data.error?.message || 'We could not verify your code. Please try again.');
  }
  return data.customer;
}

/** Save a new address and receive the created address record. */
export async function addCustomerAddress(input: AddressInput): Promise<Address> {
  const response = await fetch('/api/customer/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ address: Address }>(response);
  if (!response.ok || data.success === false || !data.address) {
    throw new Error(data.error?.message || 'We could not save your address. Please try again.');
  }
  return data.address;
}

/** Fetch the authenticated customer's orders, newest first. */
export async function listOrders(): Promise<Order[]> {
  const response = await fetch('/api/customer/orders', { headers: { 'Content-Type': 'application/json' } });
  const data = await readJson<{ orders: Order[] }>(response);
  if (!response.ok || data.success === false || !data.orders) {
    throw new Error(data.error?.message || 'We could not load your orders. Please try again.');
  }
  return data.orders;
}

/** Fetch one of the authenticated customer's orders. */
export async function getOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/customer/orders/${encodeURIComponent(orderId)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await readJson<{ order: Order }>(response);
  if (!response.ok || data.success === false || !data.order) {
    throw new Error(data.error?.message || 'We could not load this order. Please try again.');
  }
  return data.order;
}

/** Request cancellation; the order is cancelled only after an admin confirms. */
export async function requestOrderCancellation(orderId: string): Promise<Order> {
  const response = await fetch(`/api/customer/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await readJson<{ order: Order }>(response);
  if (!response.ok || data.success === false || !data.order) {
    throw new Error(data.error?.message || 'We could not request cancellation. Please try again.');
  }
  return data.order;
}

/** Request a return for a delivered order (within the return window). */
export async function requestReturn(orderId: string): Promise<Order> {
  const response = await fetch(`/api/customer/orders/${encodeURIComponent(orderId)}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await readJson<{ order: Order }>(response);
  if (!response.ok || data.success === false || !data.order) {
    throw new Error(data.error?.message || 'We could not request a return. Please try again.');
  }
  return data.order;
}

/** Look up an Indian pincode to auto-fill city and state. */
export async function lookupPincode(pincode: string): Promise<{
  city: string;
  district: string;
  state: string;
}> {
  const response = await fetch(`/api/pincode?pincode=${encodeURIComponent(pincode)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await readJson<{ data: { city: string; district: string; state: string } }>(response);
  if (!response.ok || data.success === false || !data.data) {
    throw new Error(data.error?.message || "We couldn't find that pincode. Please check and try again.");
  }
  return data.data;
}

/** Create a payment order for the checkout input (address + items). */
export async function createPaymentOrder(
  addressId: string,
  items: { slug: string; quantity: number }[],
): Promise<PaymentCreateResult> {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressId, items }),
  });
  const data = await readJson<{ payment: PaymentCreateResult }>(response);
  if (!response.ok || data.success === false || !data.payment) {
    throw new Error(data.error?.message || 'We could not start the payment. Please try again.');
  }
  return data.payment;
}

/** Verify a provider payment reported back by the checkout. */
export async function verifyPayment(input: {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}): Promise<PaymentVerifyResult> {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<PaymentVerifyResult>(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error?.message || 'We could not verify your payment. Please contact support.');
  }
  return data;
}
