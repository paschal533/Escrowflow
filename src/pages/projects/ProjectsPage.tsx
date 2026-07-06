import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, TrendingUp, Clock, Lock, Search } from 'lucide-react';
import { useJobStore } from '../../store/jobStore';
import { useAuthStore } from '../../store/authStore';

const fmt = (k: number) =>
  (k / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const STATUS_BADGE: Record<string, string> = {
  FUNDED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DISPUTED: 'bg-red-100 text-red-700',
  CREATED: 'bg-gray-100 text-gray-600',
  FUNDING_PENDING: 'bg-amber-100 text-amber-700',
  REFUND_PENDING: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  FUNDED: 'Active',
  IN_PROGRESS: 'Active',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CREATED: 'Unfunded',
  FUNDING_PENDING: 'Awaiting Approval',
  CANCELLED: 'Cancelled',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded',
};

type TabKey = 'All' | 'Active' | 'Pending' | 'Completed' | 'Unfunded';

const TAB_STATUSES: Record<TabKey, string[]> = {
  All: [],
  Active: ['FUNDED', 'IN_PROGRESS'],
  Pending: ['FUNDING_PENDING'],
  Completed: ['COMPLETED'],
  Unfunded: ['CREATED'],
};

export default function ProjectsPage() {
  const { jobs, loading, fetchJobs } = useJobStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('All');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inEscrowKobo: 0 });

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (jobs.length === 0) return;
    setStats({
      total: jobs.length,
      active: jobs.filter(j => ['FUNDED', 'IN_PROGRESS'].includes(j.status)).length,
      pending: jobs.filter(j => j.status === 'FUNDING_PENDING').length,
      inEscrowKobo: jobs.reduce((s, j) => s + j.heldAmountKobo, 0),
    });
  }, [jobs]);

  const visible = jobs.filter(j => {
    const matchTab = TAB_STATUSES[tab].length === 0 || TAB_STATUSES[tab].includes(j.status);
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const CARDS = [
    { label: 'Total Projects', value: stats.total, icon: FolderOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'In Escrow', value: fmt(stats.inEscrowKobo), icon: Lock, color: 'text-purple-600 bg-purple-50' },
  ];

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
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 gap-0.5">
          {(['All', 'Active', 'Pending', 'Completed', 'Unfunded'] as TabKey[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Link
            to="/dashboard/jobs/new"
            className="bg-[#0A1628] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-[#162035]"
          >
            + New project
          </Link>
        </div>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading...</p>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map(job => {
          const isClient = String((job.clientId as { _id: string })._id) === user?.id;
          const counterparty = isClient
            ? (job.providerId as { name: string }).name
            : (job.clientId as { name: string }).name;
          const pct = job.totalAmountKobo > 0
            ? Math.round((job.releasedAmountKobo / job.totalAmountKobo) * 100)
            : 0;
          const category = (job as unknown as { category?: string }).category;
          const dueDate = (job as unknown as { dueDate?: string }).dueDate;

          return (
            <Link
              key={job._id}
              to={`/dashboard/jobs/${job._id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block"
            >
              {/* Title row */}
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{job.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[job.status] ?? job.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{counterparty}</p>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-4">
                {category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                    {category}
                  </span>
                )}
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  You are {isClient ? 'client' : 'provider'}
                </span>
              </div>

              {/* Progress */}
              {job.status === 'CREATED' ? (
                <p className="text-xs text-amber-600 font-medium mb-3">Fund this project to begin</p>
              ) : (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div className="h-1.5 bg-[#0A1628] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Total value</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(job.totalAmountKobo)}</p>
                </div>
                {dueDate && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Due</p>
                    <p className="text-xs text-gray-600">
                      {new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
        {visible.length === 0 && !loading && (
          <div className="col-span-3 text-center py-12 text-gray-400">No projects match this filter.</div>
        )}
      </div>
    </div>
  );
}
