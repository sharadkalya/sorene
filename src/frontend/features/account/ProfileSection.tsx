'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';
import TextInput from '@/frontend/components/TextInput';
import type { AccountCustomer } from './account.types';

interface ProfileSectionProps {
  customer: AccountCustomer;
}

/** Editable profile card: avatar upload, name, email, read-only phone. */
export default function ProfileSection({ customer }: ProfileSectionProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(customer.profilePicUrl);
  const [name, setName] = useState(customer.name ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/customer/me/avatar', { method: 'POST', body: formData });
      const data: { success?: boolean; profilePicUrl?: string; error?: { message?: string } } =
        await response.json();
      if (!response.ok || data.success === false || !data.profilePicUrl) {
        throw new Error(data.error?.message || 'We could not upload your photo.');
      }
      setAvatarUrl(data.profilePicUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not upload your photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/customer/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data: { success?: boolean; error?: { message?: string } } = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || 'We could not save your profile.');
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-5">
        <h2 className="text-xl font-semibold">Profile</h2>

        {error && <div className="alert alert-error text-sm">{error}</div>}
        {saved && <div className="alert alert-success text-sm">Profile saved.</div>}

        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border border-base-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-base-200 border border-base-300 flex items-center justify-center text-base-content/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          <label className="btn btn-outline btn-sm cursor-pointer">
            {uploading ? <span className="loading loading-spinner loading-sm" /> : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Name</span>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email</span>
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Phone</span>
          <TextInput value={customer.phone} disabled />
        </div>

        <Button onClick={handleSave} variant="primary" disabled={saving} className="w-full sm:w-auto">
          {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save profile'}
        </Button>
      </div>
    </section>
  );
}
