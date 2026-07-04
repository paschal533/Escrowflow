import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useJobStore } from '../../store/jobStore';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  FUNDING_PENDING: 'bg-yellow-100 text-yellow-800',
  FUNDED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function JobsListPage() {
  const { jobs, loading, error, fetchJobs } = useJobStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) return <div className="p-6">Loading jobs...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        {user?.roles.includes('CLIENT') && (
          <Link
            to="/dashboard/jobs/new"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            + Create Job
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs yet.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/dashboard/jobs/${job._id}`}
              className="block border rounded-xl p-4 hover:shadow-md transition-shadow dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{job.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {String(job.clientId._id) === user?.id
                      ? `Provider: ${job.providerId.name}`
                      : `Client: ${job.clientId.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {job.status}
                  </span>
                  <p className="text-sm font-semibold mt-2">
                    {(job.totalAmountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
