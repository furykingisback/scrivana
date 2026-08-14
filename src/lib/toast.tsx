'use client';

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { randomId } from './utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, action?: ToastItem['action']) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/50',
  error: 'border-red-500/50',
  info: 'border-sky-500/50',
};

const TYPE_DOTS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
};

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    (message, type = 'info', action) => {
      const id = randomId();
      setItems((prev) => [...prev.slice(-4), { id, type, message, action }]);
      timers.current[id] = setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-80 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-[var(--surface)] px-3.5 py-3 shadow-xl shadow-black/20 ${TYPE_STYLES[t.type]}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOTS[t.type]}`} />
            <div className="min-w-0 flex-1 text-sm text-[var(--text)]">
              <p className="break-words">{t.message}</p>
              {t.action && (
                <button
                  className="mt-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              className="shrink-0 text-[var(--muted)] hover:text-[var(--text)]"
              onClick={() => dismiss(t.id)}
              aria-label="Kapat"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
