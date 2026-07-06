import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
});
type Form = z.infer<typeof schema>;

const NG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

export default function ProfileTab() {
  const { user, loadUser } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) return;
    api.get('/profile/me').then(r => {
      const u = r.data.data.user;
      reset({ name: u.name, phone: u.phone ?? '', location: u.location ?? '', bio: u.bio ?? '' });
    }).catch(() => setError('Failed to load profile.'));
  }, [user, reset]);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  async function onSubmit(data: Form) {
    setSaved(false); setError(null);
    try {
      await api.patch('/profile/me', data);
      await loadUser();
      setSaved(true);
    } catch { setError('Failed to save profile.'); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Change photo</p>
            <p className="text-xs text-gray-400">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">Profile saved successfully.</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input {...register('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input value={user?.email ?? ''} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+234 812 345 6789" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State / Location</label>
            <select {...register('location')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select state</option>
              {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea {...register('bio')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us about yourself..." />
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-[#0A1628] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#162035] disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Role</h2>
        <p className="text-sm text-gray-500">
          Current roles: <strong>{user?.roles.join(', ')}</strong>. You can switch between Client and Provider view using the toggle in the header.
        </p>
      </div>
    </div>
  );
}
