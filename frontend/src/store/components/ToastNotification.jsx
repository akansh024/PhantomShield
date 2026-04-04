import { CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

/**
 * Toast Notification – sits at top-right, auto-dismisses.
 */
export default function ToastNotification() {
  const { notification } = useStore();

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border max-w-sm backdrop-blur-sm
        left-4 sm:left-auto
        animate-[slideInRight_0.3s_ease-out]
        ${isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
          : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}
    >
      {isSuccess
        ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
      }
      <p className="text-sm font-medium">{notification.message}</p>
    </div>
  );
}
