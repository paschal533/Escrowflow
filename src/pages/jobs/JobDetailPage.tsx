import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { useJobStore, type Job, type Milestone } from '../../store/jobStore';
import { useAuthStore } from '../../store/authStore';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchJob } = useJobStore();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const result = await fetchJob(id);
      setJob(result.job);
      setMilestones(result.milestones);
    } catch {
      setError('Failed to load job. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, fetchJob]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(milestoneId: string) {
    setActionLoading(milestoneId);
    try {
      await api.patch(`/milestones/${milestoneId}/approve`);
      await load();
    } catch {
      setError('Failed to approve milestone.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(milestoneId: string) {
    setActionLoading(milestoneId);
    try {
      await api.patch(`/milestones/${milestoneId}/complete`, { evidenceUrls: [] });
      await load();
    } catch {
      setError('Failed to mark milestone complete.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDispute(milestoneId: string) {
    if (!confirm('Raise a dispute? Funds will be locked until admin review.')) return;
    setActionLoading(milestoneId);
    try {
      await api.patch(`/milestones/${milestoneId}/dispute`);
      await load();
    } catch {
      setError('Failed to raise dispute.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error && !job) return <div className="p-6 text-red-500">{error}</div>;
  if (!job) return <div className="p-6 text-gray-500">Job not found.</div>;

  const isClient = user?.id === String(job.clientId._id);
  const isProvider = user?.id === String(job.providerId._id);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
      <p className="text-gray-500 mb-4">{job.description}</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-bold">{(job.totalAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">In Escrow</p>
          <p className="font-bold text-blue-600">
            {(job.heldAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Released</p>
          <p className="font-bold text-green-600">
            {(job.releasedAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
          </p>
        </div>
      </div>

      {job.virtualAccountNumber && job.status === 'FUNDING_PENDING' && (
        <div className="border-2 border-emerald-500 rounded-xl p-4 mb-6 bg-emerald-50 dark:bg-emerald-900/20">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
            Fund this job
          </p>
          <p className="text-sm">
            Transfer {(job.totalAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} to:
          </p>
          <p className="text-2xl font-mono font-bold mt-2">{job.virtualAccountNumber}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{job.virtualAccountBank}</p>
        </div>
      )}

      <h2 className="font-semibold text-lg mb-3">Milestones</h2>
      <div className="space-y-3">
        {milestones.map((m) => (
          <div key={m._id} className="border rounded-xl p-4 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{m.title}</span>
              <span className="font-bold">{(m.amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{m.description}</p>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {m.status}
            </span>

            {isProvider && m.status === 'PENDING' && (
              <button
                onClick={() => handleComplete(m._id)}
                disabled={actionLoading === m._id}
                className="ml-3 text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === m._id ? 'Saving...' : 'Mark Complete'}
              </button>
            )}

            {isClient && m.status === 'PROVIDER_MARKED_COMPLETE' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleApprove(m._id)}
                  disabled={actionLoading === m._id}
                  className="text-sm bg-emerald-600 text-white px-3 py-1 rounded-full hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === m._id ? 'Saving...' : 'Approve & Release Payment'}
                </button>
                <button
                  onClick={() => handleDispute(m._id)}
                  disabled={actionLoading === m._id}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  Dispute
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
