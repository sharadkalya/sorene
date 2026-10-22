import { cookies } from 'next/headers';
import { getCustomerSessionSecret } from '@/common/env';
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_TTL_MS,
  signCustomerToken,
  verifyCustomerToken,
  type CustomerSessionPayload,
} from './customer-token';

/**
 * Next.js-coupled customer session helpers: read/write the signed HttpOnly
 * cookie. Token signing/verification lives in `customer-token.ts`.
 */

export async function createCustomerSession(payload: CustomerSessionPayload): Promise<void> {
  const token = signCustomerToken(getCustomerSessionSecret(), payload);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CUSTOMER_TTL_MS / 1000,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<CustomerSessionPayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!value) {
    return null;
  }
  try {
    return verifyCustomerToken(value, getCustomerSessionSecret());
  } catch {
    return null;
  }
}
