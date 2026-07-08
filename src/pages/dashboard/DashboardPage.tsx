import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/projects': 'Projects',
  '/dashboard/payments': 'Payments',
  '/dashboard/disputes': 'Disputes',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings': 'Settings',
  '/dashboard/jobs/new': 'Create Project',
  '/dashboard/admin': 'Admin',
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/jobs/')) return 'Project Detail';
  if (pathname.startsWith('/dashboard/admin')) return 'Admin';
  return 'Dashboard';
}

export default function DashboardShell() {
  const { loadUser } = useAuthStore();
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle(pathname)} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
