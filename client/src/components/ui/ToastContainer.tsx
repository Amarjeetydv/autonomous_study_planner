import { useEffect, useState } from 'react';
import { toast, ToastMessage } from '../../services/toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : isError
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="h-5 w-5 text-brand-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && <h4 className="text-xs font-bold uppercase tracking-wider opacity-90 mb-0.5">{t.title}</h4>}
              <p className="text-sm font-medium leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition opacity-70 hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
