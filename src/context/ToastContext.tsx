import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: number; type: ToastType; message: string }

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLE: Record<ToastType, { box: string; icon: React.ReactNode }> = {
  success: { box: 'bg-emerald-50 border-emerald-300 text-emerald-900', icon: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> },
  error:   { box: 'bg-rose-50 border-rose-300 text-rose-900',          icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> },
  warning: { box: 'bg-amber-50 border-amber-300 text-amber-900',       icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> },
  info:    { box: 'bg-blue-50 border-blue-300 text-blue-900',          icon: <Info className="w-4 h-4 text-blue-600 shrink-0" /> },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    // Gộp thông báo trùng liền kề (tránh spam khi user bấm liên tục)
    setToasts((t) => [...t.filter((x) => x.message !== message), { id, type, message }].slice(-4));
    setTimeout(() => dismiss(id), type === 'error' || type === 'warning' ? 7000 : 4500);
  }, [dismiss]);

  const api = useRef<ToastApi>({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    warning: (m) => push('warning', m),
    info: (m) => push('info', m),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* z-[100] > z-50 của modal => toast luôn nổi trên mọi modal */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-2 p-3 rounded-xl border shadow-lg text-xs font-medium ${STYLE[t.type].box}`}
          >
            {STYLE[t.type].icon}
            <span className="flex-1 leading-relaxed">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Đóng thông báo">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
