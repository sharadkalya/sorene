'use client';

import { useEffect, useState } from 'react';

interface User {
  _id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export default function CRUDPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User created successfully!');
        setFormData({ username: '' });
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to create user');
    }
  };

  // Update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingId) return;

    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User updated successfully!');
        setFormData({ username: '' });
        setEditingId(null);
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to update user');
    }
  };

  // Delete user
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User deleted successfully!');
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to delete user');
    }
  };

  // Start editing
  const startEdit = (user: User) => {
    setEditingId(user._id);
    setFormData({ username: user.username });
    setError('');
    setSuccess('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ username: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">MongoDB CRUD Test</h1>
          <p className="text-base-content/60">Test MongoDB connection and CRUD operations</p>
          <a href="/" className="btn btn-ghost btn-sm mt-2">
            ← Back to Home
          </a>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">
              {editingId ? 'Update User' : 'Create New User'}
            </h2>
            <form onSubmit={editingId ? handleUpdate : handleCreate}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="input input-bordered flex-1"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ username: e.target.value })
                    }
                    required
                    minLength={2}
                    maxLength={50}
                  />
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Users List</h2>
              <button
                onClick={fetchUsers}
                className="btn btn-sm btn-ghost"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  '🔄 Refresh'
                )}
              </button>
            </div>

            {loading && users.length === 0 ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                No users found. Create your first user above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="font-medium">{user.username}</td>
                        <td className="text-sm text-base-content/60">
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="btn btn-sm btn-info"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="btn btn-sm btn-error"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-sm text-base-content/60">
              Total users: <span className="font-bold">{users.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
