import { useState } from "react";
import type { PillarInfo } from "../store";

interface Props {
  initial?: Partial<PillarInfo>;
  submitLabel: string;
  onSubmit: (info: PillarInfo) => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

/** Name, short name and description of a pillar — for adding one or renaming it. */
export function PillarForm({ initial = {}, submitLabel, onSubmit, onCancel, children }: Props) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [short, setShort] = useState(initial.short ?? "");
  const [why, setWhy] = useState(initial.why ?? "");
  const valid = title.trim() !== "";

  return (
    <form
      className="pillar-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ title: title.trim(), short: short.trim() || title.trim(), why: why.trim() });
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <label className="field">
        Name
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Computer Graphics"
          autoFocus
        />
      </label>
      <label className="field">
        <span>
          Short name <span className="muted">(for roadmaps and the web)</span>
        </span>
        <input
          className="input"
          value={short}
          onChange={(e) => setShort(e.target.value)}
          placeholder={title.trim() || "e.g. Graphics"}
          maxLength={28}
        />
      </label>
      <label className="field pillar-form__wide">
        <span>
          Why it matters <span className="muted">(optional)</span>
        </span>
        <input
          className="input"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="One line to remind yourself why you’re learning this"
        />
      </label>
      <div className="form-actions pillar-form__wide">
        <button className="btn btn--primary btn--sm" type="submit" disabled={!valid}>
          {submitLabel}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>
          Cancel
        </button>
        {children && <span className="pillar-form__extra">{children}</span>}
      </div>
    </form>
  );
}
