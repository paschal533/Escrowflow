import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '../../store/toastStore';

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  error: XCircle,
  success: CheckCircle2,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40',
};

const AUTO_DISMISS_MS = 6000;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${STYLES[toast.type]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
        <X className="h-4 w-4 opacity-60 hover:opacity-100" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
