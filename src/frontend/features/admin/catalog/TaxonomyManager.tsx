'use client';

import { useState } from 'react';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';
import Switch from '@/frontend/components/Switch';
import TextInput from '@/frontend/components/TextInput';
import ImageUploader from './ImageUploader';

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface TaxonomyManagerProps {
  kind: 'categories' | 'collections';
  initialItems: TaxonomyItem[];
}

interface FormState {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { name: '', description: '', imageUrl: '', isActive: true };

/**
 * Shared CRUD manager for categories and collections. Both are single-image
 * taxonomies with identical shapes, so one parameterized component serves both.
 */
export default function TaxonomyManager({ kind, initialItems }: TaxonomyManagerProps) {
  const label = kind === 'categories' ? 'Category' : 'Collection';
  const apiPath = `/api/admin/catalog/${kind}`;

  const [items, setItems] = useState<TaxonomyItem[]>(initialItems);
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TaxonomyItem | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item: TaxonomyItem) => {
    setForm({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
    });
    setEditing(item);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(`${label} name is required.`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(editing ? `${apiPath}/${editing.id}` : apiPath, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl || undefined,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Save failed. Please try again.');
        return;
      }

      const dataKey = kind === 'categories' ? 'category' : 'collection';
      const savedItem = data[dataKey] as TaxonomyItem;

      if (editing) {
        setItems((prev) => prev.map((item) => (item.id === savedItem.id ? savedItem : item)));
      } else {
        setItems((prev) => [...prev, savedItem]);
      }

      setModalOpen(false);
    } catch {
      setError('Save failed. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);

    try {
      const response = await fetch(`${apiPath}/${deleting.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Delete failed. Please try again.');
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError('Delete failed. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{label}s</h1>
          <p className="text-base-content/70">Organize products into {label.toLowerCase()}s.</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          + Add {label}
        </Button>
      </div>

      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

      {items.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-16">
            <p className="text-base-content/60">No {label.toLowerCase()}s yet. Create your first one.</p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto p-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover">
                    <td>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg border border-base-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center text-base-content/40">
                          —
                        </div>
                      )}
                    </td>
                    <td className="font-semibold">{item.name}</td>
                    <td className="text-base-content/60 text-sm">{item.slug}</td>
                    <td className="text-base-content/70 text-sm max-w-xs truncate">{item.description}</td>
                    <td>
                      <Badge variant={item.isActive ? 'success' : 'ghost'}>
                        {item.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Button onClick={() => openEdit(item)} variant="ghost" size="xs">
                          Edit
                        </Button>
                        <Button onClick={() => setDeleting(item)} variant="ghost" size="xs" className="text-error">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / edit modal */}
      {modalOpen && (
        <div className={`modal ${modalOpen ? 'modal-open' : ''}`}>
          <div className="modal-box p-6">
            <h3 className="text-lg font-bold mb-4">
              {editing ? `Edit ${label}` : `Add ${label}`}
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Name</span>
                <TextInput
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={`${label} name`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="textarea w-full"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional short description"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Cover image</span>
                <ImageUploader
                  images={form.imageUrl ? [form.imageUrl] : []}
                  max={1}
                  onChange={(images) => setForm((prev) => ({ ...prev, imageUrl: images[0] ?? '' }))}
                />
              </div>

              <Switch
                label="Visible on the storefront"
                description={`Hidden ${label.toLowerCase()}s won't appear in the shop.`}
                checked={form.isActive}
                onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="modal-action gap-2">
              <Button onClick={closeModal} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="modal modal-open">
          <div className="modal-box p-6">
            <h3 className="text-lg font-bold mb-2">Delete {label}?</h3>
            <p className="text-base-content/70">
              “{deleting.name}” will be removed and unlinked from all products. This cannot be undone.
            </p>
            <div className="modal-action gap-2">
              <Button onClick={() => setDeleting(null)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleDelete} variant="error" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
