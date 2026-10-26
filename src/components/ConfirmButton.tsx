import { useState } from "react";

interface Props {
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}

/** Destructive action that asks for a second click inline instead of a modal. */
export function ConfirmButton({ children, confirmLabel, onConfirm, className = "btn btn--ghost btn--sm btn--danger" }: Props) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }

  return (
    <span className="confirm" role="group">
      <button
        type="button"
        className="btn btn--sm btn--danger"
        autoFocus
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  );
}
