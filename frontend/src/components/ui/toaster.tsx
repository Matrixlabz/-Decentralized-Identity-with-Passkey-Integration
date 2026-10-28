import React, { createContext, useContext, useState } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, type = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const bgColors = {
          default: 'bg-slate-900 border-slate-700 text-white',
          success: 'bg-emerald-950 border-emerald-600 text-emerald-100',
          error: 'bg-rose-950 border-rose-600 text-rose-100',
          warning: 'bg-amber-950 border-amber-600 text-amber-100',
        };

        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`p-4 rounded-xl border shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] ${
              bgColors[t.type || 'default']
            }`}
          >
            <div className="font-semibold text-sm">{t.title}</div>
            {t.description && <div className="text-xs opacity-90 mt-1">{t.description}</div>}
          </div>
        );
      })}
    </div>
  );
};
