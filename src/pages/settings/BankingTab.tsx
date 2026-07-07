import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard } from 'lucide-react';
import api from '../../api/client';

const schema = z.object({
  bankAccountNumber: z.string().length(10, 'Must be 10 digits'),
  bankCode: z.string().length(3, 'Must be 3 characters'),
  bankName: z.string().min(2),
});
type Form = z.infer<typeof schema>;

interface BankInfo { bankName?: string; bankAccountNumber?: string; bankCode?: string }

export default function BankingTab() {
  const [bank, setBank] = useState<BankInfo>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    api.get('/profile/me').then(r => {
      const u = r.data.data.user;
      setBank({ bankName: u.bankName, bankAccountNumber: u.bankAccountNumber, bankCode: u.bankCode });
      if (u.bankAccountNumber) reset({ bankAccountNumber: u.bankAccountNumber, bankCode: u.bankCode ?? '', bankName: u.bankName ?? '' });
    }).catch(() => setError('Failed to load bank details.'));
  }, [reset]);

  async function onSubmit(data: Form) {
    setSaved(false); setError(null);
    try {
      await api.patch('/profile/bank', data);
      setBank(data); setSaved(true);
    } catch { setError('Failed to save bank account.'); }
  }

  return (
    <div className="space-y-6">
      {/* Saved accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
        </div>
        {bank.bankAccountNumber ? (
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard size={16} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{bank.bankName}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <p className="text-xs text-gray-400">{bank.bankAccountNumber}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No bank account saved yet.</p>
        )}
      </div>

      {/* Add / Update account */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{bank.bankAccountNumber ? 'Update Bank Account' : 'Add Bank Account'}</h2>
        {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">Bank account saved successfully.</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (10 digits)</label>
            <input {...register('bankAccountNumber')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0123456789" />
            {errors.bankAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Code (3 chars, e.g. 058)</label>
            <input {...register('bankCode')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="058" />
            {errors.bankCode && <p className="text-red-500 text-xs mt-1">{errors.bankCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input {...register('bankName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Guaranty Trust Bank" />
            {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-[#0A1628] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#162035] disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Transaction Limits — static UI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Transaction Limits</h2>
        <p className="text-sm text-gray-400 mb-4">Your current tier limits per transaction and per month.</p>
        {[
          { label: 'Single transaction limit', used: 850000, max: 2000000 },
          { label: 'Monthly escrow limit', used: 1800000, max: 5000000 },
        ].map(l => (
          <div key={l.label} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{l.label}</span>
              <span className="text-gray-500 text-xs">
                {(l.used / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })} / {(l.max / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-1.5 bg-[#0A1628] rounded-full" style={{ width: `${Math.round(l.used / l.max * 100)}%` }} />
            </div>
          </div>
        ))}
        <button className="text-sm text-blue-600 hover:underline">Upgrade limit tier →</button>
      </div>
    </div>
  );
}
