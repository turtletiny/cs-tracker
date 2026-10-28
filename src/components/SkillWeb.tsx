import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CONNECTIONS, PILLAR_BY_ID, PILLARS, WEB_HUB, WEB_RING } from "../data/pillars";
import { findThreads, type SkillSummary } from "../lib/skills";
import { useStore } from "../store";
import type { PillarId } from "../types";
import { Medallion } from "./Pips";

const WEB_LABEL: Record<PillarId, string> = {
  programming: "Programming",
  architecture: "Architecture",
  algorithms: "Algorithms",
  math: "Math",
  os: "OS",
  networking: "Networking",
  databases: "Databases",
  languages: "Languages",
  distributed: "Distributed",
  interview: "Interviewing",
};

// Positions as fractions of the (square) web.
const CX = 0.5;
const CY = 0.47;
const RADIUS = 0.37;

function position(id: PillarId) {
  if (id === WEB_HUB) return { x: CX, y: CY };
  const i = WEB_RING.indexOf(id);
  const t = -Math.PI / 2 + (i * Math.PI * 2) / WEB_RING.length;
  return { x: CX + RADIUS * Math.cos(t), y: CY + RADIUS * Math.sin(t) };
}

type Pt = { x: number; y: number };

/** Subject links bow toward the hub; personal threads bow off to one side so both stay visible. */
function curve(a: Pt, b: Pt, size: number, mode: "inward" | "aside") {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  let cx: number;
  let cy: number;
  if (mode === "inward") {
    cx = mx + (CX - mx) * 0.32;
    cy = my + (CY - my) * 0.32;
  } else {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    // Bow away from the hub so threads don't sit on top of the subject links.
    if (nx * (mx - CX) + ny * (my - CY) < 0) {
      nx = -nx;
      ny = -ny;
    }
    cx = mx + nx * 0.07;
    cy = my + ny * 0.07;
  }
  const s = (n: number) => (n * size).toFixed(1);
  return `M ${s(a.x)} ${s(a.y)} Q ${s(cx)} ${s(cy)} ${s(b.x)} ${s(b.y)}`;
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

type Lit = "both" | "one" | "none";

export function SkillWeb({ skills }: { skills: Record<PillarId, SkillSummary> }) {
  const pillars = useStore((s) => s.pillars);
  const threads = useMemo(() => findThreads(pillars), [pillars]);
  const [focus, setFocus] = useState<PillarId | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const started = (id: PillarId) => skills[id].progress > 0;
  const litOf = (a: PillarId, b: PillarId): Lit =>
    started(a) && started(b) ? "both" : started(a) || started(b) ? "one" : "none";
  const touches = (e: { a: PillarId; b: PillarId }, id: PillarId) => e.a === id || e.b === id;

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set<PillarId>([focus]);
    for (const e of [...CONNECTIONS, ...threads]) {
      if (e.a === focus) set.add(e.b);
      if (e.b === focus) set.add(e.a);
    }
    return set;
  }, [focus, threads]);

  const litCount = CONNECTIONS.filter((c) => litOf(c.a, c.b) === "both").length;
  const nodes = [WEB_HUB, ...WEB_RING];

  return (
    <section className="web-panel" aria-labelledby="web-h">
      <div className="web" ref={ref} onMouseLeave={() => setFocus(null)}>
        {size > 0 && (
          <svg className="web__edges" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            {CONNECTIONS.map((c) => (
              <path
                key={`${c.a}-${c.b}`}
                d={curve(position(c.a), position(c.b), size, "inward")}
                data-lit={litOf(c.a, c.b)}
                data-focus={focus ? touches(c, focus) : undefined}
              />
            ))}
            {threads.map((t) => {
              // Planned threads only show while tracing a skill; started ones always do.
              const active = t.rungs.some((r) => r.rung.startedAt || r.rung.doneAt);
              if (!active && !(focus && touches(t, focus))) return null;
              return (
                <path
                  key={`t-${t.a}-${t.b}`}
                  className="web__thread"
                  d={curve(position(t.a), position(t.b), size, "aside")}
                  data-done={t.rungs.some((r) => r.rung.doneAt)}
                  data-planned={!active || undefined}
                  data-focus={focus ? touches(t, focus) : undefined}
                />
              );
            })}
          </svg>
        )}
        {nodes.map((id, i) => {
          const p = position(id);
          const s = skills[id];
          return (
            <Link
              key={id}
              to={`/pillar/${id}`}
              className="web-node"
              data-hub={id === WEB_HUB || undefined}
              data-dim={neighbours ? !neighbours.has(id) : undefined}
              data-focus={focus === id || undefined}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, "--i": i } as React.CSSProperties}
              aria-label={`${PILLAR_BY_ID[id].title}: level ${s.level} of ${s.max}, ${s.rank}`}
              onMouseEnter={() => setFocus(id)}
              onFocus={() => setFocus(id)}
              onBlur={() => setFocus(null)}
            >
              <Medallion steps={s.steps} level={s.level} />
              <span className="web-node__label">{WEB_LABEL[id]}</span>
            </Link>
          );
        })}
      </div>

      <div className="web-caption" aria-live="polite">
        {focus ? (
          <FocusCaption id={focus} skills={skills} threads={threads} litOf={litOf} />
        ) : (
          <>
            <h2 id="web-h" className="web-caption__title">
              How it all connects
            </h2>
            <p className="small muted">
              {litCount} of {CONNECTIONS.length} links lit. A link goes solid once you’ve made progress on both
              ends. Point at a skill to trace its links; click to open it.
            </p>
            <ul className="web-legend">
              <li>
                <svg aria-hidden="true">
                  <line x1="0" y1="6" x2="28" y2="6" data-lit="both" />
                </svg>
                Both sides started
              </li>
              <li>
                <svg aria-hidden="true">
                  <line x1="0" y1="6" x2="28" y2="6" data-lit="one" />
                </svg>
                One side started
              </li>
              <li>
                <svg aria-hidden="true">
                  <line x1="0" y1="6" x2="28" y2="6" data-lit="none" />
                </svg>
                Not yet
              </li>
              <li>
                <svg aria-hidden="true">
                  <line x1="0" y1="6" x2="28" y2="6" className="web__thread" />
                </svg>
                A step you’ve started that builds both
              </li>
            </ul>
            <p className="small muted">
              The ring around each skill is its ladder: one segment per level, inked once it’s done.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function FocusCaption({
  id,
  skills,
  threads,
  litOf,
}: {
  id: PillarId;
  skills: Record<PillarId, SkillSummary>;
  threads: ReturnType<typeof findThreads>;
  litOf: (a: PillarId, b: PillarId) => Lit;
}) {
  const seed = PILLAR_BY_ID[id];
  const s = skills[id];
  const links = CONNECTIONS.filter((c) => c.a === id || c.b === id)
    .map((c) => ({ other: c.a === id ? c.b : c.a, why: c.why }))
    .sort((x, y) => PILLARS.findIndex((p) => p.id === x.other) - PILLARS.findIndex((p) => p.id === y.other));
  const bridges = threads
    .filter((t) => t.a === id || t.b === id)
    .flatMap((t) => t.rungs.map((r) => ({ ...r, other: r.pillarId === id ? (t.a === id ? t.b : t.a) : r.pillarId })));

  return (
    <>
      <span className="eyebrow num">
        Lv {s.level} / {s.max} · {s.rank}
      </span>
      <h2 id="web-h" className="web-caption__title">
        {seed.title}
      </h2>
      <ul className="web-links">
        {links.map((l) => (
          <li key={l.other} data-lit={litOf(id, l.other)}>
            <strong>{PILLAR_BY_ID[l.other].short}</strong>
            <span className="small muted">{l.why}</span>
          </li>
        ))}
      </ul>
      {bridges.length > 0 && (
        <div className="stack-s">
          <span className="note__label">your threads</span>
          <ul className="web-links">
            {bridges.map((b) => (
              <li key={`${b.rung.id}-${b.other}`} data-thread={b.rung.doneAt ? "done" : b.rung.startedAt ? "doing" : "planned"}>
                <strong>{b.rung.label}</strong>
                <span className="small muted">
                  {b.pillarId === id ? `also builds ${PILLAR_BY_ID[b.other].short}` : `from ${PILLAR_BY_ID[b.pillarId].short}`}
                  {b.rung.doneAt ? " · done" : b.rung.startedAt ? " · in progress" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
