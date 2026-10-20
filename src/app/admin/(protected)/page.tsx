import { getTheme } from '@/backend/features/settings/settings.service';
import AdminDashboard from '@/frontend/features/admin/AdminDashboard';

/**
 * Server component: fetches the active theme and delegates interactivity to the
 * client dashboard. Data fetching stays server-side; only the theme picker UI
 * needs client JavaScript.
 */
export default async function AdminDashboardPage() {
  const theme = await getTheme();
  return <AdminDashboard initialTheme={theme} />;
}
