import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react';
import type { Toast } from '../types';

interface ToastContextValue {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 400,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: `1.5px solid ${
                toast.type === 'success' 
                  ? 'var(--color-success)'
                  : toast.type === 'error'
                    ? 'var(--color-danger)'
                    : 'var(--color-warning)'
              }`
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: toast.type === 'success'
                      ? 'var(--color-success)'
                      : toast.type === 'error'
                        ? 'var(--color-danger)'
                        : 'var(--color-warning)',
                  }}
                >
                  {toast.title}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {toast.message}
                </p>
              </div>

              <button
                type='button'
                aria-label='Close toast'
                onClick={() => removeToast(toast.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                }}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
