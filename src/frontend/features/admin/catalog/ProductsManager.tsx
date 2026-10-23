'use client';

import { useState } from 'react';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';
import Select from '@/frontend/components/Select';
import Switch from '@/frontend/components/Switch';
import TextInput from '@/frontend/components/TextInput';
import ImageUploader from './ImageUploader';

interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  categories: CategoryRef[];
  collections: CategoryRef[];
  status: 'draft' | 'active';
  featured: boolean;
  materialInfo: string;
  manufacturingInfo: string;
  stockQuantity: number;
}

interface ProductsManagerProps {
  initialProducts: ProductRecord[];
  categories: CategoryRef[];
  collections: CategoryRef[];
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  images: string[];
  categoryIds: string[];
  collectionIds: string[];
  status: 'draft' | 'active';
  featured: boolean;
  materialInfo: string;
  manufacturingInfo: string;
  stockQuantity: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  images: [],
  categoryIds: [],
  collectionIds: [],
  status: 'draft',
  featured: false,
  materialInfo: '',
  manufacturingInfo: '',
  stockQuantity: '',
};

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
}

/**
 * Admin product CRUD: name/description/price, R2 image gallery, and many-to-many
 * category & collection assignment.
 */
export default function ProductsManager({
  initialProducts,
  categories,
  collections,
}: ProductsManagerProps) {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ProductRecord | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product: ProductRecord) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
      images: product.images,
      categoryIds: product.categories.map((category) => category.id),
      collectionIds: product.collections.map((collection) => collection.id),
      status: product.status,
      featured: product.featured,
      materialInfo: product.materialInfo ?? '',
      manufacturingInfo: product.manufacturingInfo ?? '',
      stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : '',
    });
    setEditing(product);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError('');
  };

  const toggleId = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || form.price.trim() === '') {
      setError('Name, description, and price are required.');
      return;
    }

    const stockQuantity = form.stockQuantity.trim() ? Number(form.stockQuantity) : 0;
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError('Stock quantity must be a whole number of 0 or more.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice.trim() ? Number(form.compareAtPrice) : null,
      images: form.images,
      categories: form.categoryIds,
      collections: form.collectionIds,
      status: form.status,
      featured: form.featured,
      materialInfo: form.materialInfo.trim(),
      manufacturingInfo: form.manufacturingInfo.trim(),
      stockQuantity,
    };

    try {
      const response = await fetch(editing ? `/api/admin/catalog/products/${editing.id}` : '/api/admin/catalog/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Save failed. Please try again.');
        return;
      }

      const saved = data.product as ProductRecord;
      if (editing) {
        setProducts((prev) => prev.map((product) => (product.id === saved.id ? saved : product)));
      } else {
        setProducts((prev) => [saved, ...prev]);
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
      const response = await fetch(`/api/admin/catalog/products/${deleting.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Delete failed. Please try again.');
        return;
      }
      setProducts((prev) => prev.filter((product) => product.id !== deleting.id));
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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-base-content/70">Manage your catalog, prices, and imagery.</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          + Add Product
        </Button>
      </div>

      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

      {products.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-16">
            <p className="text-base-content/60">No products yet. Add your first product.</p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto p-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Categories</th>
                  <th>Collections</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-base-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center text-base-content/40">
                            —
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          {product.featured && <Badge variant="secondary" size="sm">Featured</Badge>}
                        </div>
                      </div>
                    </td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <Badge variant="outline">{product.stockQuantity ?? 0}</Badge>
                    </td>
                    <td>
                      <Badge variant={product.status === 'active' ? 'success' : 'ghost'}>
                        {product.status === 'active' ? 'Active' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="text-sm text-base-content/70">
                      {product.categories.length
                        ? product.categories.map((category) => category.name).join(', ')
                        : '—'}
                    </td>
                    <td className="text-sm text-base-content/70">
                      {product.collections.length
                        ? product.collections.map((collection) => collection.name).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Button onClick={() => openEdit(product)} variant="ghost" size="xs">
                          Edit
                        </Button>
                        <Button onClick={() => setDeleting(product)} variant="ghost" size="xs" className="text-error">
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
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Name</span>
                  <TextInput
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Product name"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <Select
                    className="w-full"
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, status: event.target.value as 'draft' | 'active' }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Price (INR)</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Compare-at price (optional)</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={(event) => setForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))}
                    placeholder="Original price"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Stock quantity (internal)</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockQuantity}
                    onChange={(event) => setForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="textarea w-full"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Product details, materials, and story"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Material info (optional)</span>
                  <textarea
                    className="textarea w-full"
                    value={form.materialInfo}
                    onChange={(event) => setForm((prev) => ({ ...prev, materialInfo: event.target.value }))}
                    placeholder="Fabrics, trims, hardware"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Manufacturing info (optional)</span>
                  <textarea
                    className="textarea w-full"
                    value={form.manufacturingInfo}
                    onChange={(event) => setForm((prev) => ({ ...prev, manufacturingInfo: event.target.value }))}
                    placeholder="Where and how it is made"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Images</span>
                <ImageUploader
                  images={form.images}
                  max={12}
                  onChange={(images) => setForm((prev) => ({ ...prev, images }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Categories</span>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-3">
                    {categories.length === 0 && (
                      <p className="text-sm text-base-content/50">No categories yet.</p>
                    )}
                    {categories.map((category) => (
                      <label key={category.id} className="label cursor-pointer justify-start gap-3 py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={form.categoryIds.includes(category.id)}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, categoryIds: toggleId(prev.categoryIds, category.id) }))
                          }
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Collections</span>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-3">
                    {collections.length === 0 && (
                      <p className="text-sm text-base-content/50">No collections yet.</p>
                    )}
                    {collections.map((collection) => (
                      <label key={collection.id} className="label cursor-pointer justify-start gap-3 py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-secondary checkbox-sm"
                          checked={form.collectionIds.includes(collection.id)}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, collectionIds: toggleId(prev.collectionIds, collection.id) }))
                          }
                        />
                        <span>{collection.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Switch
                label="Featured product"
                description="Show this product in the featured-first sort."
                checked={form.featured}
                onChange={(checked) => setForm((prev) => ({ ...prev, featured: checked }))}
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
            <h3 className="text-lg font-bold mb-2">Delete Product?</h3>
            <p className="text-base-content/70">
              “{deleting.name}” will be permanently removed. This cannot be undone.
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
