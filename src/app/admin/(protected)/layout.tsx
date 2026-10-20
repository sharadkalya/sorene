import { requireAdminPage } from '@/backend/auth/requireAdmin';
import AdminShell from '@/frontend/features/admin/AdminShell';

/**
 * Server-side authorization guard for everything under `/admin` except the
 * login page, wrapped in the shared admin shell. Authorization can never be
 * bypassed from the browser.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
