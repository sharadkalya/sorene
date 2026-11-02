'use client';

import { useState } from 'react';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';
import Select from '@/frontend/components/Select';
import TextInput from '@/frontend/components/TextInput';

interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: string | null;
  authorName: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogManagerProps {
  initialPosts: BlogPostRecord[];
}

interface BlogForm {
  title: string;
  slug: string;
  status: 'draft' | 'published';
  metaDescription: string;
  excerpt: string;
  authorName: string;
  coverImageUrl: string;
  tags: string;
  canonicalUrl: string;
  publishedAt: string;
  content: string;
}

const EMPTY_FORM: BlogForm = {
  title: '',
  slug: '',
  status: 'draft',
  metaDescription: '',
  excerpt: '',
  authorName: '',
  coverImageUrl: '',
  tags: '',
  canonicalUrl: '',
  publishedAt: '',
  content: '',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

/**
 * Admin blog CRUD: title/slug/URL, SEO metadata, cover image, and markdown
 * content with draft/published state.
 */
export default function BlogManager({ initialPosts }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPostRecord[]>(initialPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPostRecord | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BlogPostRecord | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (post: BlogPostRecord) => {
    setForm({
      title: post.title,
      slug: post.slug,
      status: post.status,
      metaDescription: post.metaDescription ?? '',
      excerpt: post.excerpt ?? '',
      authorName: post.authorName ?? '',
      coverImageUrl: post.coverImageUrl ?? '',
      tags: post.tags?.join(', ') ?? '',
      canonicalUrl: post.canonicalUrl ?? '',
      publishedAt: toDateInput(post.publishedAt),
      content: post.content,
    });
    setEditing(post);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      metaDescription: form.metaDescription.trim(),
      excerpt: form.excerpt.trim(),
      authorName: form.authorName.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      canonicalUrl: form.canonicalUrl.trim(),
      status: form.status,
      content: form.content,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    if (form.publishedAt) payload.publishedAt = form.publishedAt;

    try {
      const response = await fetch(editing ? `/api/admin/blog/${editing.id}` : '/api/admin/blog', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Save failed. Please try again.');
        return;
      }

      const saved = data.post as BlogPostRecord;
      if (editing) {
        setPosts((prev) => prev.map((post) => (post.id === saved.id ? saved : post)));
      } else {
        setPosts((prev) => [saved, ...prev]);
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
      const response = await fetch(`/api/admin/blog/${deleting.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Delete failed. Please try again.');
        return;
      }
      setPosts((prev) => prev.filter((post) => post.id !== deleting.id));
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
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-base-content/70">Publish SEO posts at /blog/&lt;slug&gt; without touching code.</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          + Add Post
        </Button>
      </div>

      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

      {posts.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-16">
            <p className="text-base-content/60">No posts yet. Write your first blog post.</p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto p-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl}
                            alt={post.title}
                            className="w-12 h-12 object-cover rounded-lg border border-base-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center text-base-content/40">
                            —
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{post.title}</div>
                          <div className="text-xs text-base-content/60 max-w-md truncate">
                            {post.metaDescription || post.excerpt || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="text-xs">/blog/{post.slug}</code>
                    </td>
                    <td>
                      <Badge variant={post.status === 'published' ? 'success' : 'ghost'}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="text-sm text-base-content/70">{formatDate(post.publishedAt)}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Button onClick={() => openEdit(post)} variant="ghost" size="xs">
                          Edit
                        </Button>
                        <Button onClick={() => setDeleting(post)} variant="ghost" size="xs" className="text-error">
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
          <div className="modal-box max-w-4xl p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Post' : 'Add Post'}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Title</span>
                  <TextInput
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Post title"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Slug (URL)</span>
                  <TextInput
                    type="text"
                    value={form.slug}
                    onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                    placeholder="my-post-slug"
                  />
                  <span className="text-xs text-base-content/60">
                    Lives at <code>/blog/{form.slug.trim() || '…'}</code>. Leave blank to auto-generate from the title.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <Select
                    className="w-full"
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, status: event.target.value as 'draft' | 'published' }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Published date (optional)</span>
                  <TextInput
                    type="date"
                    value={form.publishedAt}
                    onChange={(event) => setForm((prev) => ({ ...prev, publishedAt: event.target.value }))}
                  />
                  <span className="text-xs text-base-content/60">Leave blank to use today when publishing.</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Author (optional)</span>
                  <TextInput
                    type="text"
                    value={form.authorName}
                    onChange={(event) => setForm((prev) => ({ ...prev, authorName: event.target.value }))}
                    placeholder="SORvÈNE"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Tags (comma-separated)</span>
                  <TextInput
                    type="text"
                    value={form.tags}
                    onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="leather care, handbags"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Cover image URL (optional)</span>
                  <TextInput
                    type="text"
                    value={form.coverImageUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                    placeholder="https://…"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Canonical URL (optional)</span>
                  <TextInput
                    type="text"
                    value={form.canonicalUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, canonicalUrl: event.target.value }))}
                    placeholder="https://sorvenestudio.com/blog/…"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Meta description</span>
                <textarea
                  className="textarea w-full"
                  value={form.metaDescription}
                  onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
                  placeholder="Short SEO description shown in search results"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Excerpt</span>
                <textarea
                  className="textarea w-full"
                  value={form.excerpt}
                  onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                  placeholder="Short summary shown on the blog index"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Content (Markdown)</span>
                <textarea
                  className="textarea w-full font-mono text-sm"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder={'## Heading\n\nWrite your post in Markdown…'}
                  rows={14}
                />
              </div>
            </div>

            <div className="modal-action gap-2">
              <Button onClick={closeModal} variant="outline" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Post'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-6">
            <h3 className="text-lg font-bold mb-2">Delete Post</h3>
            <p className="text-base-content/70 mb-4">
              Delete &ldquo;{deleting.title}&rdquo;? This cannot be undone.
            </p>
            <div className="modal-action gap-2">
              <Button onClick={() => setDeleting(null)} variant="outline" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleDelete} variant="error" disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
