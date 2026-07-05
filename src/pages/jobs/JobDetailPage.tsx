import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../../api/client';
import { useJobStore, type Job, type Milestone } from '../../store/jobStore';
import { useAuthStore } from '../../store/authStore';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchJob, fundAccount } = useJobStore();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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
    setUploading(true);
    try {
      const { uploadFile } = await import('../../api/cloudinary');
      const evidenceUrls = await Promise.all(evidenceFiles.map(uploadFile));
      await api.patch(`/milestones/${milestoneId}/complete`, { evidenceUrls });
      setEvidenceFiles([]);
      await load();
    } catch {
      setError('Failed to mark milestone complete.');
    } finally {
      setUploading(false);
      setActionLoading(null);
    }
  }

  async function handleFundAccount() {
    if (!id) return;
    setActionLoading('fund');
    setError(null);
    try {
      await fundAccount(id);
      await load();
    } catch {
      setError('Failed to create virtual account. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!id) return;
    if (!confirm('Cancel this job? This cannot be undone.')) return;
    setActionLoading('cancel');
    setError(null);
    try {
      await api.patch(`/jobs/${id}/cancel`);
      await load();
    } catch {
      setError('Failed to cancel job. Jobs can only be cancelled before funding.');
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

      {isClient && job.status === 'CREATED' && (
        <div className="border-2 border-amber-400 rounded-xl p-4 mb-6 bg-amber-50 dark:bg-amber-900/20">
          <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Payment account not set up yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Create a virtual account to accept payment for this job.
          </p>
          <button
            onClick={handleFundAccount}
            disabled={actionLoading === 'fund'}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm"
          >
            {actionLoading === 'fund' ? 'Setting up...' : 'Setup Payment Account'}
          </button>
        </div>
      )}

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
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Fund this job</p>
          <p className="text-sm mb-3">Transfer <strong>{(job.totalAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</strong> to:</p>
          <div className="flex items-start gap-6">
            <div>
              <p className="text-2xl font-mono font-bold">{job.virtualAccountNumber}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{job.virtualAccountBank}</p>
              <p className="text-xs text-gray-400 mt-1">Scan QR or copy account number above</p>
            </div>
            <div className="bg-white p-2 rounded-lg flex-shrink-0">
              <QRCode
                value={`${job.virtualAccountNumber}|${job.virtualAccountBank}|${job.totalAmountKobo}`}
                size={100}
              />
            </div>
          </div>
        </div>
      )}

      {isClient && (job.status === 'CREATED' || job.status === 'FUNDING_PENDING') && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleCancel}
            disabled={actionLoading === 'cancel'}
            className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Job'}
          </button>
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
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-gray-500 font-medium">Attach evidence (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => setEvidenceFiles(Array.from(e.target.files ?? []))}
                  className="block text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {evidenceFiles.length > 0 && (
                  <p className="text-xs text-gray-400">{evidenceFiles.length} file(s) selected</p>
                )}
                <button
                  onClick={() => handleComplete(m._id)}
                  disabled={actionLoading === m._id || uploading}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Mark Complete'}
                </button>
              </div>
            )}

            {m.evidenceUrls && m.evidenceUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.evidenceUrls.map((url, i) => (
                  <a key={i} href={/^https?:\/\//i.test(url) ? url : '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">
                    Evidence {i + 1}
                  </a>
                ))}
              </div>
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
