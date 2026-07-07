import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/client';

const schema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type Form = z.infer<typeof schema>;

export default function SecurityTab() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setSaved(false); setError(null);
    try {
      await api.patch('/profile/password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      setSaved(true);
      reset();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to change password.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
        {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">Password updated successfully.</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'currentPassword' as const, label: 'Current password', placeholder: '••••••••' },
            { name: 'newPassword' as const, label: 'New password', placeholder: 'At least 8 characters' },
            { name: 'confirmPassword' as const, label: 'Confirm new password', placeholder: 'Repeat new password' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="password" {...register(f.name)} placeholder={f.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name]?.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={isSubmitting} className="bg-[#0A1628] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#162035] disabled:opacity-50">
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* 2FA — UI only */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Not enabled</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account.</p>
        {[
          { label: 'Authenticator app', sub: 'Use Google Authenticator or Authy', badge: 'Recommended' },
          { label: 'SMS / USSD', sub: 'Receive a code on your phone number' },
        ].map(opt => (
          <div key={opt.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                {opt.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{opt.badge}</span>}
              </div>
              <p className="text-xs text-gray-400">{opt.sub}</p>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Enable</button>
          </div>
        ))}
      </div>

      {/* Active sessions — UI only */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h2>
        <div className="flex items-center justify-between py-3 border border-gray-100 rounded-lg px-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">This browser</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">This device</span>
            </div>
            <p className="text-xs text-gray-400">Active now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
