import React, { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = {
    success: "bg-white border-accent-200 text-ink-900",
    error: "bg-white border-red-200 text-ink-900",
    info: "bg-white border-slate-200 text-ink-900",
  };
  const iconColors = { success: "text-accent-600", error: "text-red-500", info: "text-slate-500" };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-xl border shadow-popover px-4 py-3 text-sm ${colors[t.type]}`}
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${iconColors[t.type]}`} />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
