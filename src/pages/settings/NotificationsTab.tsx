import { useEffect, useState } from 'react';
import api from '../../api/client';

type PrefEntry = { email: boolean; push: boolean };
type Prefs = {
  milestoneComplete: PrefEntry; milestoneApproved: PrefEntry;
  projectFunded: PrefEntry; newInvitation: PrefEntry;
  paymentReleased: PrefEntry; paymentReceived: PrefEntry;
  escrowLowBalance: PrefEntry; disputeUpdate: PrefEntry;
};

const SECTIONS: { title: string; keys: (keyof Prefs)[]; labels: string[]; subs: string[] }[] = [
  {
    title: 'PROJECTS & MILESTONES',
    keys: ['milestoneComplete', 'milestoneApproved', 'projectFunded', 'newInvitation'],
    labels: ['Milestone marked complete', 'Milestone approved', 'Project funded', 'New project invitation'],
    subs: ['When a provider marks a milestone as done', 'When you or the other party approves a milestone', 'When escrow is funded for a project', 'When someone invites you to a project'],
  },
  {
    title: 'PAYMENTS',
    keys: ['paymentReleased', 'paymentReceived', 'escrowLowBalance'],
    labels: ['Payment released', 'Payment received', 'Escrow low balance'],
    subs: ['When funds are released from escrow', 'When you receive a milestone payment', 'When escrow balance drops below a threshold'],
  },
  {
    title: 'DISPUTES',
    keys: ['disputeUpdate'],
    labels: ['Dispute update'],
    subs: ['When there is an update on a dispute'],
  },
];

const DEFAULT: Prefs = {
  milestoneComplete: { email: true, push: true }, milestoneApproved: { email: true, push: true },
  projectFunded: { email: true, push: false }, newInvitation: { email: true, push: true },
  paymentReleased: { email: true, push: true }, paymentReceived: { email: true, push: true },
  escrowLowBalance: { email: false, push: false }, disputeUpdate: { email: true, push: true },
};

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/profile/notifications')
      .then(r => setPrefs(r.data.data.prefs ?? DEFAULT))
      .catch(() => setError('Failed to load notification preferences.'));
  }, []);

  function toggle(key: keyof Prefs, channel: 'email' | 'push') {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));
  }

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try { await api.patch('/profile/notifications', prefs); setSaved(true); }
    catch { setError('Failed to save preferences. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
        {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">Preferences saved.</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
        {SECTIONS.map(s => (
          <div key={s.title} className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{s.title}</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px] bg-gray-50 px-4 py-2 text-xs text-gray-400 font-medium border-b border-gray-200">
                <span />
                <span className="text-center">Email</span>
                <span className="text-center">Push</span>
              </div>
              {s.keys.map((key, i) => (
                <div key={key} className="grid grid-cols-[1fr_80px_80px] px-4 py-3 border-b border-gray-100 last:border-0 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.labels[i]}</p>
                    <p className="text-xs text-gray-400">{s.subs[i]}</p>
                  </div>
                  {(['email', 'push'] as const).map(ch => (
                    <div key={ch} className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={prefs[key][ch]}
                        onChange={() => toggle(key, ch)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={save} disabled={saving} className="bg-[#0A1628] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#162035] disabled:opacity-50">
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
