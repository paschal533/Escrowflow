import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Lock, MessageSquare } from 'lucide-react';
import api from '../../api/client';
import { useViewStore } from '../../store/viewStore';

const fmt = (k: number) =>
  (k / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

interface DisputeRow {
  _id: string;
  dspId: string;
  project: string;
  milestone: string;
  amountKobo: number;
  status: string;
}

interface DisputeStats {
  open: number;
  resolved: number;
  fundsAtRiskKobo: number;
}

export default function UserDisputesPage() {
  const { viewRole } = useViewStore();
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [selected, setSelected] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/profile/disputes?role=${viewRole}`)
      .then((r) => {
        setStats(r.data.data.stats);
        setDisputes(r.data.data.disputes);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Failed to load disputes. Please try again.'
        );
      })
      .finally(() => setLoading(false));
  }, [viewRole]);

  const CARDS = stats
    ? [
        { label: 'Open Disputes', value: stats.open, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
        { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        { label: 'Funds at Risk', value: fmt(stats.fundsAtRiskKobo), icon: Lock, color: 'text-amber-600 bg-amber-50' },
      ]
    : [];

  return (
    <div className="p-8">
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {CARDS.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Disputes</h2>
          </div>
          {loading && <p className="p-6 text-gray-400 text-sm">Loading...</p>}
          {!loading && disputes.length === 0 && !error && (
            <p className="p-6 text-gray-400 text-sm">No disputes found.</p>
          )}
          <div className="divide-y divide-gray-50">
            {disputes.map((d) => (
              <button
                key={d._id}
                onClick={() => setSelected(d)}
                className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                  selected?._id === d._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{d.project}</p>
                    <p className="text-xs text-gray-400">{d.milestone}</p>
                    <p className="text-xs text-gray-400 mt-1">{d.dspId}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.status === 'DISPUTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {d.status === 'DISPUTED' ? 'Under Review' : 'Refunded'}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{fmt(d.amountKobo)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center min-h-64">
          {!selected ? (
            <div className="text-center text-gray-400 p-8">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a dispute</p>
              <p className="text-sm mt-1">Click a dispute from the list to view its details and timeline.</p>
            </div>
          ) : (
            <div className="p-6 w-full">
              <h3 className="font-semibold text-gray-900 mb-1">{selected.project}</h3>
              <p className="text-sm text-gray-500 mb-1">{selected.milestone}</p>
              <p className="text-xs text-gray-400 mb-4">{selected.dspId}</p>
              <p className="text-lg font-bold text-gray-900 mb-4">{fmt(selected.amountKobo)}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selected.status === 'DISPUTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {selected.status === 'DISPUTED' ? 'Under Review' : 'Refunded'}
              </span>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">
                  For dispute resolution, contact support or view the project:
                </p>
                <Link to="/dashboard/disputes" className="text-sm text-blue-600 hover:underline">
                  View project details →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
