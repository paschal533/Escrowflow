import { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingUp, Clock, Calendar } from 'lucide-react';
import api from '../../api/client';
import { useViewStore } from '../../store/viewStore';

const fmt = (k: number) => (k / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

interface TxnRow {
  txnId: string; project: string; company: string; type: string;
  date: string; amountKobo: number; direction: 'incoming' | 'outgoing'; status: string;
}
interface TxnStats { totalReceivedKobo: number; totalPaidOutKobo: number; pendingReleaseKobo: number; thisMonthKobo: number }

type FilterKey = 'all' | 'incoming' | 'outgoing';

export default function PaymentsPage() {
  const { viewRole } = useViewStore();
  const [stats, setStats] = useState<TxnStats | null>(null);
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/profile/transactions?role=${viewRole}&filter=${filter}`)
      .then(r => {
        setStats(r.data.data.stats);
        setTransactions(r.data.data.transactions);
      })
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, [viewRole, filter]);

  const CARDS = stats ? [
    { label: 'Total Received', value: fmt(stats.totalReceivedKobo), sub: 'as service provider', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Paid Out', value: fmt(stats.totalPaidOutKobo), sub: 'escrow + milestones', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Release', value: fmt(stats.pendingReleaseKobo), sub: 'awaiting milestone approval', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'This Month', value: fmt(stats.thisMonthKobo), sub: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} activity`, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ] : [];

  return (
    <div className="p-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['all', 'incoming', 'outgoing'] as FilterKey[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {f === 'all' ? 'All' : f === 'incoming' ? 'Incoming' : 'Outgoing'}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="px-6 py-3 text-sm text-red-500">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left px-6 py-3">Transaction</th>
                <th className="text-left px-6 py-3">Project</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-right px-6 py-3">Amount</th>
                <th className="text-right px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No transactions yet.</td></tr>
              )}
              {transactions.map((t) => (
                <tr key={t.txnId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.txnId}</p>
                    <p className="text-xs text-gray-400">{t.company}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{t.project}</td>
                  <td className="px-6 py-4 text-gray-600">{t.type}</td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${t.direction === 'incoming' ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.direction === 'incoming' ? '+' : '-'}{fmt(t.amountKobo)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
