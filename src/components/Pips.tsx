import type { RungStatus } from "../lib/skills";

/** One segment per rung: a linear level meter. */
export function Pips({ steps, label }: { steps: RungStatus[]; label: string }) {
  const done = steps.filter((s) => s === "done").length;
  return (
    <span className="pips" role="img" aria-label={`${label}: ${done} of ${steps.length} levels`}>
      {steps.map((s, i) => (
        <i key={i} data-step={s} />
      ))}
    </span>
  );
}

const SIZE = 48;
const C = SIZE / 2;

function arc(r: number, t0: number, t1: number) {
  const x0 = C + r * Math.cos(t0);
  const y0 = C + r * Math.sin(t0);
  const x1 = C + r * Math.cos(t1);
  const y1 = C + r * Math.sin(t1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${t1 - t0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}

/** The same meter bent into a ring, with the level in the middle. */
export function Medallion({ steps, level }: { steps: RungStatus[]; level: number }) {
  const n = steps.length;
  const r = 20;
  const slice = (Math.PI * 2) / Math.max(n, 1);
  const gap = n > 1 ? Math.min(0.22, slice * 0.2) : 0.0001;

  return (
    <span className="medallion" data-mastered={n > 0 && level === n}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {n === 0 ? (
          <circle cx={C} cy={C} r={r} data-step="todo" />
        ) : (
          steps.map((s, i) => {
            const t0 = -Math.PI / 2 + i * slice + gap / 2;
            return <path key={i} d={arc(r, t0, t0 + slice - gap)} data-step={s} />;
          })
        )}
      </svg>
      <span className="medallion__level num">{level}</span>
    </span>
  );
}
