'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subscriber {
    _id: string;
    name: string;
    email: string;
    count: number;
    discountCode: string;
    createdAt: string;
    updatedAt: string;
}

export default function SubscribersAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication
        const auth = localStorage.getItem('adminAuth');
        if (auth !== 'true') {
            router.push('/admin/login');
            return;
        }

        setIsAuthenticated(true);
        fetchSubscribers();
    }, [router]);

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/subscribers');
            const data = await response.json();

            if (data.success) {
                setSubscribers(data.subscribers || []);
            } else {
                setError(data.message || 'Failed to load subscribers');
            }
        } catch (err) {
            console.error('Error fetching subscribers:', err);
            setError('Failed to load subscribers');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        router.push('/admin/login');
    };

    const handleBackToDashboard = () => {
        router.push('/admin');
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-ghost normal-case text-xl"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
                <div className="flex-none gap-2">
                    <button onClick={handleLogout} className="btn btn-ghost">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Stay Tuned Subscribers</h1>
                        <p className="text-base-content/70">
                            Total Subscribers: {subscribers.length}
                        </p>
                    </div>
                    <button
                        onClick={fetchSubscribers}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Refreshing...
                            </>
                        ) : (
                            'Refresh'
                        )}
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats Cards */}
                {!loading && subscribers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="stats shadow">
                            <div className="stat">
                                <div className="stat-title">Total Subscribers</div>
                                <div className="stat-value text-primary">{subscribers.length}</div>
                                <div className="stat-desc">All time</div>
                            </div>
                        </div>

                        <div className="stats shadow">
                            <div className="stat">
                                <div className="stat-title">Repeat Interest</div>
                                <div className="stat-value text-secondary">
                                    {subscribers.filter(s => s.count > 1).length}
                                </div>
                                <div className="stat-desc">Showed interest multiple times</div>
                            </div>
                        </div>

                        <div className="stats shadow">
                            <div className="stat">
                                <div className="stat-title">Highest Interest</div>
                                <div className="stat-value text-accent">
                                    {Math.max(...subscribers.map(s => s.count))}
                                </div>
                                <div className="stat-desc">Maximum count from one user</div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body text-center py-20">
                            <h2 className="text-2xl font-semibold mb-2">No Subscribers Yet</h2>
                            <p className="text-base-content/70">
                                When users show interest, they will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="overflow-x-auto p-6">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th className="px-4">#</th>
                                        <th className="px-4">Name</th>
                                        <th className="px-4">Email</th>
                                        <th className="px-4">Interest Count</th>
                                        <th className="px-4">Discount code</th>
                                        <th className="px-4">First Subscribed</th>
                                        <th className="px-4">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((subscriber, index) => (
                                        <tr key={subscriber._id} className="hover">
                                            <td className="px-4 py-4">{index + 1}</td>
                                            <td className="px-4 py-4 font-semibold">{subscriber.name}</td>
                                            <td className="px-4 py-4">
                                                <a
                                                    href={`mailto:${subscriber.email}`}
                                                    className="link link-primary"
                                                >
                                                    {subscriber.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-semibold text-lg">
                                                    {subscriber.count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                    {subscriber.discountCode}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {formatDate(subscriber.createdAt)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-base-content/60">
                                                {formatDate(subscriber.updatedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
