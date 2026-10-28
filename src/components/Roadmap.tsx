import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PILLAR_BY_ID } from "../data/pillars";
import { rungParts, summarize, useBookMap, type RungParts } from "../lib/skills";
import { useStore } from "../store";
import type { Book, PillarId, Rung } from "../types";

const UNIT_SHORT: Record<string, string> = { chapter: "Ch", project: "Project", lab: "Lab", lecture: "Lecture" };

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function partName(parts: RungParts, k: number) {
  const unit = UNIT_SHORT[parts.unit] ?? capitalise(parts.unit);
  const title = parts.titles[k - 1];
  return title ? `${unit} ${k} · ${title}` : `${unit} ${k}`;
}

interface Seg {
  rung: Rung;
  book: Book | undefined;
  parts: RungParts;
  done: boolean;
}

/** A pillar’s roadmap: one horizontal lane per track, resources in order, chapter by chapter. */
export function Roadmap({ pillarId, showHead = true }: { pillarId: PillarId; showHead?: boolean }) {
  const pillar = useStore((s) => s.pillars[pillarId]);
  const bookById = useBookMap();
  const seed = PILLAR_BY_ID[pillarId];
  const summary = summarize(pillar, bookById);
  const tracks = [...new Set(pillar.rungs.map((r) => r.track))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
  const grouped = tracks.some(Boolean);

  return (
    <section
      className="rm-row"
      aria-label={`${seed.title} roadmap`}
      data-complete={summary.max > 0 && summary.level === summary.max}
      data-headless={!showHead || undefined}
    >
      {showHead && (
        <header className="rm-row__head">
          <Link to={`/pillar/${pillarId}`} className="rm-row__title">
            {seed.short}
          </Link>
          <span className="rm-row__stats num">
            <strong>{Math.round(summary.progress * 100)}%</strong>
            <span className="muted">
              {summary.level}/{summary.max} done
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
              name={grouped ? track || "General" : ""}
              segs={pillar.rungs
                .filter((r) => r.track === track)
                .map((rung) => {
                  const book = rung.bookId ? bookById.get(rung.bookId) : undefined;
                  const parts = rungParts(rung, book);
                  return { rung, book, parts, done: !!rung.doneAt };
                })}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Lane({ pillarId, name, segs }: { pillarId: PillarId; name: string; segs: Seg[] }) {
  const setProgress = useStore((s) => s.setRungProgress);
  const toggleDone = useStore((s) => s.toggleRungDone);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);

  // The next thing to do: the first unread part of the first unfinished resource.
  const open = segs.find((s) => !s.done);
  const currentKey = open
    ? open.parts.total && open.parts.done < open.parts.total
      ? `${open.rung.id}:${open.parts.done + 1}`
      : `${open.rung.id}:end`
    : null;
  const lastKey = segs.length ? `${segs.at(-1)!.rung.id}:end` : null;
  const focusKey = currentKey ?? lastKey;

  // Open each lane scrolled to where you are.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const node = el?.querySelector<HTMLElement>("[data-current]");
    if (!el || !node) return;
    el.scrollLeft = Math.max(0, node.offsetLeft - el.clientWidth * 0.35);
    // Only on mount, so the lane doesn't jump while you click through it.
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLOListElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button.rm-node")];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const j =
      e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : e.key === "ArrowRight" ? Math.min(buttons.length - 1, i + 1) : Math.max(0, i - 1);
    buttons[j]?.focus();
  }

  const readout = (() => {
    const key = hover ?? currentKey;
    if (!key) return { label: "Every resource done", text: "" };
    const [rid, part] = key.split(":");
    const seg = segs.find((s) => s.rung.id === rid);
    if (!seg) return null;
    const what =
      part === "end"
        ? seg.parts.total
          ? `Finish ${seg.rung.label}`
          : seg.rung.label
        : `${partName(seg.parts, Number(part))} — ${seg.rung.label}`;
    return { label: hover ? (hover === currentKey ? "Next" : "") : "Next", text: what };
  })();

  return (
    <div className="lane" data-named={name ? true : undefined}>
      {name && <span className="lane__name">{name}</span>}
      <div className="lane__body">
        <div className="lane__scroll" ref={scrollRef}>
          <ol className="lane__track" onKeyDown={onKeyDown} onMouseLeave={() => setHover(null)}>
            {segs.map((seg) => {
              const { rung, parts } = seg;
              const reached = seg.done || parts.done > 0;
              const count = parts.total ? `${parts.done}/${parts.total}` : null;
              return (
                <li
                  key={rung.id}
                  className="seg"
                  data-reached={reached || undefined}
                  data-done={seg.done || undefined}
                  data-single={!parts.total || undefined}
                >
                  <span className="seg__label" title={rung.label}>
                    <span className="seg__name">{rung.label}</span>
                    {count && <span className="seg__count num">{count}</span>}
                  </span>
                  <span className="seg__nodes">
                    {parts.total != null &&
                      Array.from({ length: parts.total }, (_, i) => {
                        const k = i + 1;
                        const key = `${rung.id}:${k}`;
                        const done = k <= parts.done;
                        return (
                          <button
                            key={k}
                            type="button"
                            className="rm-node rm-node--part"
                            data-done={done || undefined}
                            data-current={key === currentKey || undefined}
                            aria-pressed={done}
                            aria-label={`${partName(parts, k)}, ${rung.label}`}
                            tabIndex={key === focusKey ? 0 : -1}
                            onMouseEnter={() => setHover(key)}
                            onFocus={() => setHover(key)}
                            onBlur={() => setHover(null)}
                            onClick={() => setProgress(pillarId, rung.id, parts.done === k ? k - 1 : k)}
                          >
                            <span className="num">{k}</span>
                          </button>
                        );
                      })}
                    <button
                      type="button"
                      className="rm-node rm-node--milestone"
                      data-done={seg.done || undefined}
                      data-current={`${rung.id}:end` === currentKey || undefined}
                      aria-pressed={seg.done}
                      aria-label={parts.total ? `Finished ${rung.label}` : `Done: ${rung.label}`}
                      tabIndex={`${rung.id}:end` === focusKey ? 0 : -1}
                      onMouseEnter={() => setHover(`${rung.id}:end`)}
                      onFocus={() => setHover(`${rung.id}:end`)}
                      onBlur={() => setHover(null)}
                      onClick={() => toggleDone(pillarId, rung.id)}
                    >
                      <span aria-hidden="true">{seg.done ? "✓" : ""}</span>
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        {readout && (
          <p className="lane__readout small" aria-live="polite">
            {readout.label && <span className="lane__readout-label">{readout.label}</span>}
            {readout.text}
          </p>
        )}
      </div>
    </div>
  );
}
