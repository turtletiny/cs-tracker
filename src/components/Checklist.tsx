import { useState } from "react";
import { checklistProgress } from "../lib/selectors";
import { useStore } from "../store";
import type { ChecklistId } from "../types";
import { useToast } from "./Toast";

interface Props {
  list: ChecklistId;
  title: string;
  /** Anchor id for the heading. */
  anchor: string;
  children?: React.ReactNode;
}

export function Checklist({ list, title, anchor, children }: Props) {
  const all = useStore((s) => s.checklist);
  const toggle = useStore((s) => s.toggleChecklistItem);
  const add = useStore((s) => s.addChecklistItem);
  const remove = useStore((s) => s.removeChecklistItem);
  const toast = useToast((s) => s.show);
  const checklist = all.filter((c) => c.list === list);
  const groups = [...new Set(checklist.map((c) => c.group))];
  const done = checklist.filter((c) => c.doneAt).length;

  return (
    <section aria-labelledby={anchor} className="checklist">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h2 id={anchor}>{title}</h2>
        <span className="small muted num">
          {done} of {checklist.length} · {Math.round(checklistProgress(checklist) * 100)}%
        </span>
      </div>
      <div className="checklist__groups">
        {groups.map((group) => {
          const items = checklist.filter((c) => c.group === group);
          return (
            <div key={group} className="checklist__group">
              <h3>
                {group}
                <span className="small muted num" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>
                  {items.filter((i) => i.doneAt).length}/{items.length}
                </span>
              </h3>
              {items.map((item) => (
                <div key={item.id} className="check">
                  <label>
                    <input type="checkbox" checked={!!item.doneAt} onChange={() => toggle(item.id)} />
                    <span className="check__label">{item.label}</span>
                  </label>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => {
                      remove(item.id);
                      toast(`Removed “${item.label}”`, { label: "Undo", run: () => add(list, group, item.label) });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <AddItem onAdd={(label) => add(list, group, label)} id={`add-${list}-${group}`} group={group} />
            </div>
          );
        })}
      </div>
      {children}
    </section>
  );
}

function AddItem({ onAdd, id, group }: { onAdd: (label: string) => void; id: string; group: string }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="inline-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
    >
      <label className="visually-hidden" htmlFor={id}>
        Add to {group}
      </label>
      <input id={id} className="input" placeholder="Add an item…" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="submit" className="btn btn--sm" disabled={!value.trim()}>
        Add
      </button>
    </form>
  );
}
