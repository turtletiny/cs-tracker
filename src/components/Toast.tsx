import { useEffect } from "react";
import { create } from "zustand";

interface ToastState {
  message: string | null;
  action: { label: string; run: () => void } | null;
  key: number;
  show: (message: string, action?: { label: string; run: () => void }) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  action: null,
  key: 0,
  show: (message, action) => set((s) => ({ message, action: action ?? null, key: s.key + 1 })),
  hide: () => set({ message: null, action: null }),
}));

export function Toast() {
  const { message, action, key, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(hide, action ? 6000 : 3000);
    return () => window.clearTimeout(t);
  }, [message, action, key, hide]);

  if (!message) return null;

  return (
    <div className="toast row" role="status" key={key}>
      <span>{message}</span>
      {action && (
        <button
          type="button"
          className="btn btn--sm"
          style={{ color: "var(--highlight)", borderColor: "oklch(50% 0.04 262)" }}
          onClick={() => {
            action.run();
            hide();
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
