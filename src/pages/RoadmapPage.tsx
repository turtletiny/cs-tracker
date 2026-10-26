import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Cover } from "../components/Cover";
import { ProgressBar } from "../components/ProgressBar";
import { PILLARS, ROADMAP_EDGES, ROADMAP_LAYOUT } from "../data/pillars";
import { bookProgress, checklistProgress, progressLabel, PILLAR_STATUS } from "../lib/selectors";
import { useStore } from "../store";
import type { PillarId } from "../types";

interface Edge {
  from: PillarId;
  to: PillarId;
  d: string;
}

function useEdgePaths(gridRef: React.RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState<Edge[]>([]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measure = () => {
      const nodes = new Map<string, HTMLElement>();
      grid.querySelectorAll<HTMLElement>("[data-node]").forEach((el) => nodes.set(el.dataset.node!, el));
      const next: Edge[] = [];
      for (const [from, to] of ROADMAP_EDGES) {
        const a = nodes.get(from);
        const b = nodes.get(to);
        if (!a || !b) continue;
        const x1 = a.offsetLeft + a.offsetWidth / 2;
        const y1 = a.offsetTop + a.offsetHeight;
        const x2 = b.offsetLeft + b.offsetWidth / 2;
        const y2 = b.offsetTop;
        const bend = Math.max(24, (y2 - y1) * 0.55);
        next.push({ from, to, d: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}` });
      }
      setEdges(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [gridRef]);

  return edges;
}

export function RoadmapPage() {
  const pillars = useStore((s) => s.pillars);
  const books = useStore((s) => s.books);
  const checklist = useStore((s) => s.checklist);
  const attempts = useStore((s) => s.attempts);
  const gridRef = useRef<HTMLDivElement>(null);
  const edges = useEdgePaths(gridRef);

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const doneCount = PILLARS.filter((p) => pillars[p.id].status === "done").length;
  const dsaPct = checklistProgress(checklist);

  const reading = books.filter((b) => b.status === "reading");
  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = attempts.filter((a) => new Date(a.at).getTime() >= weekAgo).length;
  const solvedIds = new Set(attempts.filter((a) => a.rating !== "failed").map((a) => a.problemId));

  function progressFor(id: PillarId) {
    const p = pillars[id];
    if (p.status === "done") return 1;
    const book = p.bookId ? bookById.get(p.bookId) : undefined;
    const bp = bookProgress(book) ?? 0;
    return id === "algorithms" ? (bp + dsaPct) / 2 : bp;
  }

  return (
    <div className="home">
      <div>
        <header className="page-head">
          <span className="eyebrow">Teach yourself CS</span>
          <h1>The nine pillars</h1>
          <p className="lede">
            {doneCount === 0
              ? "Work roughly top to bottom — each line marks a prerequisite worth having first."
              : `${doneCount} of 9 complete. Each line marks a prerequisite worth having first.`}
          </p>
        </header>

        <section className="roadmap" aria-label="Roadmap">
          <div className="roadmap__grid" ref={gridRef}>
            <svg className="roadmap__edges" aria-hidden="true">
              {edges.map((e) => (
                <path key={`${e.from}-${e.to}`} d={e.d} data-done={pillars[e.from].status === "done"} />
              ))}
            </svg>
            {PILLARS.map((seed, i) => {
              const state = pillars[seed.id];
              const pos = ROADMAP_LAYOUT[seed.id];
              const pct = progressFor(seed.id);
              const status = PILLAR_STATUS.find((s) => s.id === state.status)!;
              return (
                <Link
                  key={seed.id}
                  to={`/pillar/${seed.id}`}
                  className="node"
                  data-node={seed.id}
                  data-status={state.status}
                  style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1, "--i": i } as React.CSSProperties}
                >
                  {state.status === "done" && (
                    <span className="node__stamp" aria-hidden="true">
                      done
                    </span>
                  )}
                  <span className="node__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="node__title">{seed.short}</span>
                  <span className="node__meta">
                    <span className="node__status">{status.label}</span>
                    <span className="num">{Math.round(pct * 100)}%</span>
                  </span>
                  <ProgressBar value={pct} label={`${seed.title} progress`} />
                </Link>
              );
            })}
          </div>
          <div className="roadmap__legend" aria-hidden="true">
            <span>
              <i className="legend-swatch" data-status="not-started" /> Not started
            </span>
            <span>
              <i className="legend-swatch" data-status="in-progress" /> In progress
            </span>
            <span>
              <i className="legend-swatch" data-status="done" /> Done
            </span>
          </div>
        </section>
      </div>

      <aside className="margin-notes" aria-label="At a glance">
        <div className="note">
          <span className="note__label">reading now</span>
          {reading.length === 0 ? (
            <p className="small muted">
              Nothing on the go. Open a pillar and log your first session, or{" "}
              <Link className="link" to="/books">
                pick from the book log
              </Link>
              .
            </p>
          ) : (
            reading.slice(0, 3).map((b) => (
              <Link key={b.id} to={`/books/${b.id}`} className="note__book">
                <Cover src={b.coverUrl} title={b.title} author={b.author} />
                <span className="stack-s">
                  <span className="note__title">{b.title}</span>
                  <span className="small muted num">{progressLabel(b)}</span>
                  {bookProgress(b) != null && <ProgressBar value={bookProgress(b)!} label={`${b.title} progress`} />}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="note">
          <span className="note__label">implemented</span>
          <p className="big-figure num">
            {checklist.filter((c) => c.doneAt).length}
            <small> / {checklist.length}</small>
          </p>
          <p className="small muted">
            data structures &amp; algorithms from scratch.{" "}
            <Link className="link" to="/pillar/algorithms#checklist">
              Checklist
            </Link>
          </p>
        </div>

        <div className="note">
          <span className="note__label">leetcode</span>
          <p className="big-figure num">
            {thisWeek}
            <small> this week</small>
          </p>
          <p className="small muted">
            {solvedIds.size} distinct problems solved.{" "}
            <Link className="link" to="/leetcode">
              Draw a problem →
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
