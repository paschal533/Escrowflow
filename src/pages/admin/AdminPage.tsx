import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Navigate, Link } from 'react-router-dom';

interface Stats {
  totalHeldKobo: number;
  totalReleasedKobo: number;
  totalRefundedKobo: number;
  totalJobs: number;
  activeDisputes: number;
  completionRate: number;
  jobsByStatus: Record<string, number>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border rounded-xl p-5 dark:border-gray-700">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.data));
  }, []);

  if (!user?.roles.includes('ADMIN')) return <Navigate to="/dashboard" replace />;
  if (!stats) return <div className="p-6">Loading stats...</div>;

  const fmt = (kobo: number) =>
    (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total in Escrow" value={fmt(stats.totalHeldKobo)} sub="currently held" />
        <StatCard label="Total Released" value={fmt(stats.totalReleasedKobo)} sub="paid to providers" />
        <StatCard label="Total Refunded" value={fmt(stats.totalRefundedKobo)} sub="returned to clients" />
        <StatCard label="Total Jobs" value={String(stats.totalJobs)} />
        <StatCard label="Active Disputes" value={String(stats.activeDisputes)} sub={stats.activeDisputes > 0 ? 'needs attention' : 'all clear'} />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} sub="jobs fully completed" />
      </div>

      {stats.activeDisputes > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              {stats.activeDisputes} dispute{stats.activeDisputes !== 1 ? 's' : ''} need attention
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">Review and resolve disputed milestones</p>
          </div>
          <Link
            to="/dashboard/admin/disputes"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Manage Disputes →
          </Link>
        </div>
      )}

      <h2 className="font-semibold mb-3">Jobs by Status</h2>
      <div className="border rounded-xl overflow-hidden dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.jobsByStatus).map(([status, count]) => (
              <tr key={status} className="border-t dark:border-gray-700">
                <td className="px-4 py-3">{status}</td>
                <td className="px-4 py-3 text-right font-mono">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
