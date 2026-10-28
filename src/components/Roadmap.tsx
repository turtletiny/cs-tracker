import { useState } from "react";
import { Link } from "react-router";
import { PILLAR_BY_ID } from "../data/pillars";
import { rungParts, rungStatus, summarize, useBookMap, type RungParts, type RungStatus } from "../lib/skills";
import { clamp, formatDate } from "../lib/util";
import { useStore } from "../store";
import type { Book, PillarId, Rung } from "../types";

const UNIT_SHORT: Record<string, string> = { chapter: "Ch", project: "Project", lab: "Lab", lecture: "Lecture" };

function partName(parts: RungParts, k: number) {
  const unit = UNIT_SHORT[parts.unit] ?? parts.unit.charAt(0).toUpperCase() + parts.unit.slice(1);
  const title = parts.titles[k - 1];
  return title ? `${unit} ${k} · ${title}` : `${unit} ${k}`;
}

interface Seg {
  rung: Rung;
  book: Book | undefined;
  parts: RungParts;
  status: RungStatus;
}

/**
 * A pillar’s roadmap: per track, finished resources on the left, everything in
 * progress stacked in parallel in the middle, and what’s still to start on the right.
 */
export function Roadmap({ pillarId, compact = false }: { pillarId: PillarId; compact?: boolean }) {
  const pillar = useStore((s) => s.pillars[pillarId]);
  const bookById = useBookMap();
  const seed = PILLAR_BY_ID[pillarId];
  const summary = summarize(pillar, bookById);
  const active = summary.steps.filter((s) => s === "doing").length;
  const tracks = [...new Set(pillar.rungs.map((r) => r.track))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
  const grouped = tracks.some(Boolean);

  return (
    <section
      className="rm-row"
      aria-label={`${seed.title} roadmap`}
      data-complete={summary.max > 0 && summary.level === summary.max}
      data-headless={!compact || undefined}
    >
      {compact && (
        <header className="rm-row__head">
          <Link to={`/pillar/${pillarId}`} className="rm-row__title">
            {seed.short}
          </Link>
          <span className="rm-row__stats num">
            <strong>{Math.round(summary.progress * 100)}%</strong>
            <span className="muted">
              {summary.level}/{summary.max} done{active > 0 && ` · ${active} on the go`}
            </span>
          </span>
        </header>
      )}
      <div className="rm-row__lanes">
        {pillar.rungs.length === 0 ? (
          <p className="small muted rm-empty">
            No resources yet.{" "}
            <Link className="link" to={`/pillar/${pillarId}#steps-h`}>
              Add one →
            </Link>
          </p>
        ) : (
          tracks.map((track) => (
            <Lane
              key={track || "_"}
              pillarId={pillarId}
              compact={compact}
              name={grouped ? track || "General" : ""}
              segs={pillar.rungs
                .filter((r) => r.track === track)
                .map((rung) => {
                  const book = rung.bookId ? bookById.get(rung.bookId) : undefined;
                  return { rung, book, parts: rungParts(rung, book), status: rungStatus(rung, book) };
                })}
            />
          ))
        )}
      </div>
    </section>
  );
}

/** In compact mode (the overview) only what’s in progress and the one resource after it are shown. */
function Lane({ pillarId, name, segs, compact }: { pillarId: PillarId; name: string; segs: Seg[]; compact: boolean }) {
  const done = segs
    .filter((s) => s.status === "done")
    .sort((a, b) => (a.rung.doneAt ?? "").localeCompare(b.rung.doneAt ?? ""));
  const doing = segs.filter((s) => s.status === "doing");
  const todoAll = segs.filter((s) => s.status === "todo");
  const todo = compact ? todoAll.slice(0, 1) : todoAll;
  const hiddenDone = compact ? done.length : 0;
  const hiddenTodo = todoAll.length - todo.length;
  const pillarUrl = `/pillar/${pillarId}`;

  return (
    <div className="lane" data-named={name ? true : undefined}>
      {name && <span className="lane__name">{name}</span>}
      <div className="lane__scroll">
        <div className="flow">
          {hiddenDone > 0 && (
            <Link to={pillarUrl} className="flow__more" title="See the full roadmap">
              <span>✓ {hiddenDone} done</span>
            </Link>
          )}
          {!compact && done.length > 0 && (
            <ol className="flow__run" data-phase="done" aria-label="Finished">
              {done.map((s) => (
                <SegView key={s.rung.id} pillarId={pillarId} seg={s} />
              ))}
            </ol>
          )}
          {doing.length > 0 && (
            <ol className="flow__branches" data-many={doing.length > 1 || undefined} aria-label="In progress">
              {doing.map((s) => (
                <li key={s.rung.id} className="flow__branch">
                  <SegView pillarId={pillarId} seg={s} as="div" />
                  <span className="flow__tail" aria-hidden="true" />
                </li>
              ))}
            </ol>
          )}
          {todo.length > 0 && (
            <ol className="flow__run" data-phase="todo" aria-label="Not started">
              {todo.map((s) => (
                <SegView key={s.rung.id} pillarId={pillarId} seg={s} />
              ))}
            </ol>
          )}
          {hiddenTodo > 0 && (
            <Link to={pillarUrl} className="flow__more" data-phase="todo" title="See the full roadmap">
              <span>+{hiddenTodo} more →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SegView({ pillarId, seg, as = "li" }: { pillarId: PillarId; seg: Seg; as?: "li" | "div" }) {
  const setStarted = useStore((s) => s.setRungStarted);
  const toggleDone = useStore((s) => s.toggleRungDone);
  const setProgress = useStore((s) => s.setRungProgress);
  const [hoverPart, setHoverPart] = useState<number | null>(null);
  const { rung, parts, status } = seg;
  const total = parts.total;
  // Progress keeps the step in progress, so it can only be “un-started” before any is made.
  const canUnstart =
    status === "doing" && parts.done === 0 && (!seg.book || (seg.book.currentChapter === 0 && seg.book.entries.length === 0));
  const Tag = as;

  let caption: string;
  if (status === "done") caption = rung.doneAt ? `Finished ${formatDate(rung.doneAt)}` : "Finished";
  else if (hoverPart != null && total) caption = hoverPart === 0 ? "Back to none" : `Up to ${partName(parts, hoverPart)}`;
  else if (status === "doing" && total) caption = parts.done < total ? `Next: ${partName(parts, parts.done + 1)}` : "All read";
  else if (status === "doing") caption = rung.startedAt ? `Started ${formatDate(rung.startedAt)}` : "In progress";
  else caption = total ? `${total} ${parts.unit}s` : "";

  return (
    <Tag
      className="seg"
      data-status={status}
      data-single={!total || undefined}
      style={total ? ({ "--len": clamp(total, 4, 36) } as React.CSSProperties) : undefined}
    >
      <span className="seg__label" title={rung.label}>
        {rung.url ? (
          <a className="seg__name" href={rung.url} target="_blank" rel="noreferrer">
            {rung.label}
          </a>
        ) : (
          <span className="seg__name">{rung.label}</span>
        )}
        {total != null && (
          <span className="seg__count num">
            {parts.done}/{total}
          </span>
        )}
      </span>

      <span className="seg__track">
        <button
          type="button"
          className="rm-node rm-node--start"
          data-on={status !== "todo" || undefined}
          aria-pressed={status !== "todo"}
          aria-label={status === "todo" ? `Start ${rung.label}` : `Started ${rung.label}`}
          title={status === "todo" ? "Start" : canUnstart ? "Started — click to undo" : "Started"}
          disabled={status !== "todo" && !canUnstart}
          onClick={() => setStarted(pillarId, rung.id, status === "todo")}
        />

        {total && status === "doing" ? (
          <input
            type="range"
            className="seg__bar"
            min={0}
            max={total}
            step={1}
            value={parts.done}
            style={{ "--fill": `${(parts.done / total) * 100}%` } as React.CSSProperties}
            aria-label={`${rung.label} progress`}
            aria-valuetext={`${parts.done} of ${total} ${parts.unit}s`}
            onChange={(e) => setProgress(pillarId, rung.id, Number(e.target.value))}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHoverPart(clamp(Math.round(((e.clientX - r.left) / r.width) * total), 0, total));
            }}
            onMouseLeave={() => setHoverPart(null)}
          />
        ) : (
          <span
            className="seg__line"
            aria-hidden="true"
            style={total ? ({ "--fill": `${(parts.done / total) * 100}%` } as React.CSSProperties) : undefined}
          />
        )}

        <button
          type="button"
          className="rm-node rm-node--milestone"
          data-done={status === "done" || undefined}
          aria-pressed={status === "done"}
          aria-label={status === "done" ? `Finished ${rung.label} — click to undo` : `Finish ${rung.label}`}
          title={status === "done" ? "Finished — click to undo" : "Mark finished"}
          onClick={() => toggleDone(pillarId, rung.id)}
        >
          <span aria-hidden="true">{status === "done" ? "✓" : ""}</span>
        </button>
      </span>

      <span className="seg__caption">{caption}</span>
    </Tag>
  );
}
