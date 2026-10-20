'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/catalog/products', label: 'Products' },
  { href: '/admin/catalog/categories', label: 'Categories' },
  { href: '/admin/catalog/collections', label: 'Collections' },
  { href: '/admin/subscribers', label: 'Subscribers' },
];

/**
 * Shared admin chrome: brand bar, section navigation, and logout. The admin
 * panel is desktop-first; all catalog CRUD happens inside this shell.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-md border-b border-base-300 py-2">
        <div className="flex-1 px-6 gap-2">
          <Link href="/admin" className="text-xl font-semibold mr-6">
            SORvÈNE <span className="text-primary">Admin</span>
          </Link>
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn btn-ghost btn-sm ${active ? 'btn-active text-primary' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-none px-6 gap-2 flex items-center">
          <Link href="/" className="btn btn-ghost btn-sm">
            Back to Site
          </Link>
          <button onClick={handleLogout} className="btn btn-error btn-sm">
            Logout
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
