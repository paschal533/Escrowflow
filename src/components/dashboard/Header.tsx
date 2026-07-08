import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useViewStore } from '../../store/viewStore';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const { viewRole, setViewRole } = useViewStore();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const hasClient = user?.roles.includes('CLIENT');
  const hasProvider = user?.roles.includes('PROVIDER');

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="p-1 -ml-1 text-gray-500 hover:text-gray-700 md:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
          <p className="hidden sm:block text-sm text-gray-500">{today}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Client / Provider toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(hasClient || !hasProvider) && (
            <button
              onClick={() => setViewRole('CLIENT')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewRole === 'CLIENT' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Client
            </button>
          )}
          {hasProvider && (
            <button
              onClick={() => setViewRole('PROVIDER')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewRole === 'PROVIDER' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Provider
            </button>
          )}
        </div>
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>
        <button
          onClick={() => navigate('/dashboard/jobs/new')}
          aria-label="New project"
          className="bg-[#0A1628] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#162035] flex items-center gap-1"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">+ New project</span>
        </button>
      </div>
    </header>
  );
}
