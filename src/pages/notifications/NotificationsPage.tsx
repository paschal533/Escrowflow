import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Banknote, Star, Clock } from 'lucide-react';
import api from '../../api/client';

interface Activity {
  icon: string;
  text: string;
  time: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityIcon({ icon }: { icon: string }) {
  if (icon === 'check') return <CheckCircle size={18} className="text-green-500 flex-shrink-0" />;
  if (icon === 'alert') return <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />;
  if (icon === 'fund') return <Banknote size={18} className="text-blue-500 flex-shrink-0" />;
  if (icon === 'done') return <Star size={18} className="text-emerald-500 flex-shrink-0" />;
  return <Clock size={18} className="text-gray-400 flex-shrink-0" />;
}

export default function NotificationsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/profile/activity')
      .then((r) => setActivities(r.data.data.activities))
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Failed to load activity. Please try again.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your latest project and payment events</p>
        </div>
        {loading && <p className="p-6 text-gray-400 text-sm">Loading...</p>}
        {error && (
          <p className="p-6 text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && activities.length === 0 && (
          <p className="p-6 text-gray-400 text-sm">No activity yet. Create a project to get started.</p>
        )}
        <div className="divide-y divide-gray-50">
          {activities.map((a, i) => (
            // ponytail: composite key — activities have no _id; text+time combo is unique enough
            <div key={`${a.time}-${i}`} className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5">
                <ActivityIcon icon={a.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{a.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
