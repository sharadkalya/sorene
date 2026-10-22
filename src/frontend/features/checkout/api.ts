import type { Address, AddressInput, Customer } from './types';

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
