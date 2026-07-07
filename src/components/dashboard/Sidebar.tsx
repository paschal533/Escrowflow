import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CreditCard, MessageSquare, Bell, Settings, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/disputes', label: 'Disputes', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-[#0A1628] text-white flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">EF</div>
        <span className="font-bold text-lg tracking-tight">EscrowFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#1a2942] text-white border-l-4 border-blue-500 pl-2'
                  : 'text-slate-400 hover:bg-[#1a2942] hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}
