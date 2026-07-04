import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import JobsListPage from '../jobs/JobsListPage';
import CreateJobPage from '../jobs/CreateJobPage';
import JobDetailPage from '../jobs/JobDetailPage';
import AdminPage from '../admin/AdminPage';

export default function DashboardPage() {
  const { user, logout, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-6 py-3 flex items-center justify-between dark:border-gray-700">
        <Link to="/dashboard" className="font-bold text-lg">
          EscrowFlow
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/jobs" className="text-sm hover:underline">
            My Jobs
          </Link>
          {user?.roles.includes('ADMIN') && (
            <Link to="/dashboard/admin" className="text-sm hover:underline">Admin</Link>
          )}
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1">
        <Routes>
          <Route
            index
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}</h1>
                <p className="text-gray-500 mb-4">Roles: {user?.roles.join(', ')}</p>
                <Link
                  to="/dashboard/jobs"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  View My Jobs →
                </Link>
              </div>
            }
          />
          <Route path="jobs" element={<JobsListPage />} />
          <Route path="jobs/new" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
