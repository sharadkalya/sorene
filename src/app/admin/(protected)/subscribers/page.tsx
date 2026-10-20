import { getSubscribers } from '@/backend/features/subscribers/subscriber.service';
import SubscribersTable from '@/frontend/features/admin/SubscribersTable';

/**
 * Server component: fetches subscribers server-side (behind the admin guard in
 * the route-group layout) and renders the client table.
 */
export default async function SubscribersAdminPage() {
  const subscribers = await getSubscribers();
  return <SubscribersTable subscribers={subscribers} />;
}
