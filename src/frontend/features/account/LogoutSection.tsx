'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';

/** Sign-out control that clears the customer session cookie. */
export default function LogoutSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch('/api/customer/session', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex justify-end">
      <Button onClick={handleLogout} variant="outline" disabled={busy}>
        {busy ? <span className="loading loading-spinner loading-sm" /> : 'Sign out'}
      </Button>
    </section>
  );
}
