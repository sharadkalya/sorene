import OrderScreen from '@/frontend/features/checkout/OrderScreen';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getCustomerOrNull } from '@/backend/features/customer/customer.service';
import type { AddressRecord } from '@/backend/features/customer/customer.types';

/** Storefront: order review screen shown after checkout details are collected. */
export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await getCurrentCustomer();
  const addressId = typeof params.address === 'string' ? params.address : undefined;

  let deliveryAddress: AddressRecord | null = null;
  try {
    if (session && addressId) {
      const customer = await getCustomerOrNull(session.customerId);
      deliveryAddress = customer?.addresses.find((address) => address.id === addressId) ?? null;
    }
  } catch {
    deliveryAddress = null;
  }

  return <OrderScreen deliveryAddress={deliveryAddress} deliveryAddressId={addressId ?? null} />;
}
