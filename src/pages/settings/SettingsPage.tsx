import { useState } from 'react';
import { User, Lock, Bell, CreditCard } from 'lucide-react';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import BankingTab from './BankingTab';
import NotificationsTab from './NotificationsTab';

type Tab = 'Profile' | 'Security' | 'Notifications' | 'Banking';

const TABS: { key: Tab; icon: React.ElementType }[] = [
  { key: 'Profile', icon: User },
  { key: 'Security', icon: Lock },
  { key: 'Notifications', icon: Bell },
  { key: 'Banking', icon: CreditCard },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Profile');
  const TabComponent = { Profile: ProfileTab, Security: SecurityTab, Notifications: NotificationsTab, Banking: BankingTab }[tab];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Sub-nav */}
        <nav className="md:w-48 flex-shrink-0">
          <div className="flex md:flex-col gap-0.5 overflow-x-auto bg-white rounded-xl border border-gray-200 p-2">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  tab === key
                    ? 'bg-[#1a2942] md:border-l-4 border-blue-500 text-white rounded-lg md:rounded-r-lg'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg'
                }`}
              >
                <Icon size={16} /> {key}
              </button>
            ))}
          </div>
        </nav>
        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <TabComponent />
        </div>
      </div>
    </div>
  );
}
