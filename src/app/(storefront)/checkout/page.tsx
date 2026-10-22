import CheckoutFlow from '@/frontend/features/checkout/CheckoutFlow';
import { getCurrentCustomer } from '@/backend/auth/customer-session';
import { getCustomerOrNull } from '@/backend/features/customer/customer.service';

/** Storefront: checkout — phone auth and delivery address before payment. */
export default async function CheckoutPage() {
  const session = await getCurrentCustomer();
  const customer = session ? await getCustomerOrNull(session.customerId) : null;

  return <CheckoutFlow initialCustomer={customer} />;
}
