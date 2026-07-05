import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface DisputedMilestone {
  _id: string;
  title: string;
  amountKobo: number;
  status: string;
  jobId: {
    _id: string;
    title: string;
    clientId: { name: string; email: string };
  };
}

export default function AdminDisputesPage() {
  const { user } = useAuthStore();
  if (!user?.roles?.includes('ADMIN')) return <Navigate to="/dashboard" replace />;
  const [milestones, setMilestones] = useState<DisputedMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/milestones?status=DISPUTED');
      setMilestones(data.data.milestones);
    } catch {
      setError('Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function resolve(milestoneId: string, action: 'approve' | 'refund') {
    const label = action === 'approve' ? 'release payment to provider' : 'refund client';
    if (!confirm(`This will ${label}. Continue?`)) return;
    setActionLoading(milestoneId + action);
    try {
      await api.patch(`/admin/milestones/${milestoneId}/resolve`, { action });
      await load();
    } catch {
      setError(`Failed to ${label}.`);
    } finally {
      setActionLoading(null);
    }
  }

  const fmt = (kobo: number) =>
    (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  if (loading) return <div className="p-6">Loading disputes...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Disputed Milestones</h1>
      <p className="text-sm text-gray-500 mb-6">Resolve each dispute by approving the payout or refunding the client.</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {milestones.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No disputed milestones. All clear!</div>
      ) : (
        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m._id} className="border rounded-xl p-5 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-gray-500">
                    Job: <strong>{m.jobId?.title ?? 'Unknown'}</strong> · Client: {m.jobId?.clientId?.name ?? '—'} ({m.jobId?.clientId?.email ?? ''})
                  </p>
                </div>
                <p className="font-bold text-lg">{fmt(m.amountKobo)}</p>
              </div>
              <span className="inline-block text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full mb-3">
                {m.status}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => resolve(m._id, 'approve')}
                  disabled={actionLoading !== null}
                  className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === m._id + 'approve' ? 'Processing...' : 'Approve — Pay Provider'}
                </button>
                <button
                  onClick={() => resolve(m._id, 'refund')}
                  disabled={actionLoading !== null}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading === m._id + 'refund' ? 'Processing...' : 'Refund Client'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
