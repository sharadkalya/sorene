'use client';

import { useRouter } from 'next/navigation';

interface Subscriber {
    id: string;
    name: string;
    email: string;
    count: number;
    discountCode: string;
    createdAt: string;
    updatedAt: string;
}

export default function SubscribersTable({
    subscribers,
}: {
    subscribers: Subscriber[];
}) {
    const router = useRouter();

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

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Stay Tuned Subscribers</h1>
                        <p className="text-base-content/70">
                            Total Subscribers: {subscribers.length}
                        </p>
                    </div>
                    <button onClick={handleRefresh} className="btn btn-primary">
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                {subscribers.length > 0 && (
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

                {subscribers.length === 0 ? (
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
                                        <tr key={subscriber.id} className="hover">
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
    </>
    );
}
