import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Clock, Briefcase, CheckCircle, AlertCircle, Banknote, Star } from 'lucide-react';
import api from '../../api/client';
import { useJobStore } from '../../store/jobStore';
import { useViewStore } from '../../store/viewStore';
import { useAuthStore } from '../../store/authStore';

const fmt = (k: number) => (k / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const STATUS_BADGE: Record<string, string> = {
  FUNDED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DISPUTED: 'bg-red-100 text-red-700',
  CREATED: 'bg-gray-100 text-gray-600',
  FUNDING_PENDING: 'bg-amber-100 text-amber-700',
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

interface Stats { escrowBalanceKobo: number; releasedKobo: number; activeProjects: number; pendingApprovals: number }
interface Activity { icon: string; text: string; time: string }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityIcon({ icon }: { icon: string }) {
  const props = { size: 16, className: 'flex-shrink-0' };
  if (icon === 'check') return <CheckCircle {...props} className="text-green-500 flex-shrink-0" />;
  if (icon === 'alert') return <AlertCircle {...props} className="text-amber-500 flex-shrink-0" />;
  if (icon === 'fund') return <Banknote {...props} className="text-blue-500 flex-shrink-0" />;
  if (icon === 'done') return <Star {...props} className="text-emerald-500 flex-shrink-0" />;
  return <Clock {...props} className="text-gray-400 flex-shrink-0" />;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { jobs, fetchJobs } = useJobStore();
  const { viewRole } = useViewStore();
  const { user } = useAuthStore();

  useEffect(() => {
    setFetchError(null);
    fetchJobs();
    api.get(`/profile/stats?role=${viewRole}`).then(r => setStats(r.data.data.stats)).catch(() => setFetchError('Failed to load dashboard data.'));
    api.get('/profile/activity').then(r => setActivities(r.data.data.activities)).catch(() => {});
  }, [viewRole, fetchJobs]);

  const activeJobs = jobs.filter(j => ['FUNDED', 'IN_PROGRESS', 'COMPLETED'].includes(j.status)).slice(0, 5);

  const CARDS = [
    { label: 'Escrow Balance', value: stats ? fmt(stats.escrowBalanceKobo) : '—', sub: `across ${stats?.activeProjects ?? 0} projects`, icon: Wallet, color: 'text-blue-600 bg-blue-50' },
    { label: 'Released Payments', value: stats ? fmt(stats.releasedKobo) : '—', sub: 'total disbursed', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Approvals', value: stats ? String(stats.pendingApprovals) : '—', sub: 'milestone awaiting review', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Projects', value: stats ? String(stats.activeProjects) : '—', sub: 'in progress', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="p-8">
      {fetchError && <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{fetchError}</div>}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Active Projects</h2>
            <Link to="/dashboard/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {activeJobs.length === 0 && (
              <p className="p-6 text-sm text-gray-400">No active projects yet.</p>
            )}
            {activeJobs.map(job => {
              const isClient = String((job.clientId as { _id: string })._id) === user?.id;
              const counterparty = isClient
                ? (job.providerId as { name: string }).name
                : (job.clientId as { name: string }).name;
              const pct = job.totalAmountKobo > 0
                ? Math.round((job.releasedAmountKobo / job.totalAmountKobo) * 100)
                : 0;
              return (
                <Link key={job._id} to={`/dashboard/jobs/${job._id}`} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{job.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[job.status] ?? job.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{counterparty}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-[#0A1628] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{pct}%</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(job.totalAmountKobo)}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <Link to="/dashboard/jobs/new" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              + Create new project
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.length === 0 && (
              <p className="p-6 text-sm text-gray-400">No activity yet.</p>
            )}
            {activities.map((a) => (
              <div key={`${a.icon}-${a.text}-${a.time}`} className="flex items-start gap-3 px-6 py-3">
                <ActivityIcon icon={a.icon} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{a.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.time)}</p>
                </div>
              </div>
            ))}
          </div>
          {activities.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100">
              <Link to="/dashboard/notifications" className="text-sm text-blue-600 hover:underline">View all activity</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
