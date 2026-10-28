import { useState } from "react";
import { Link } from "react-router";
import { useToast } from "../components/Toast";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import {
  blocksForDay,
  DAY_NAMES,
  durationMinutes,
  formatDuration,
  isBlockNow,
  toMinutes,
  WEEK_ORDER,
  weeklyMinutesByPillar,
} from "../lib/schedule";
import { useNow } from "../lib/useNow";
import { todayISO } from "../lib/util";
import { useStore } from "../store";
import type { PillarId, ScheduleBlock } from "../types";

export function SchedulePage() {
  const schedule = useStore((s) => s.schedule);
  const loadSample = useStore((s) => s.loadSampleSchedule);
  const now = useNow();
  const today = now.getDay();
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState(false);

  const isToday = day === today;
  const blocks = blocksForDay(schedule, day);
  const doneIds = useStore((s) => s.scheduleDone[todayISO(now)]) ?? [];
  const doneToday = blocks.filter((b) => doneIds.includes(b.id)).length;
  const planned = blocks.reduce((n, b) => n + durationMinutes(b), 0);

  return (
    <div className="schedule-page">
      <div className="stack" style={{ gap: "var(--space-l)" }}>
        <header className="page-head" style={{ marginBottom: 0 }}>
          <span className="eyebrow">Daily schedule</span>
          <h1>{isToday ? "Today" : DAY_NAMES[day]}</h1>
          <p className="lede">
            {blocks.length === 0
              ? `Nothing planned for ${isToday ? "today" : DAY_NAMES[day]}.`
              : isToday
                ? `${doneToday} of ${blocks.length} blocks done · ${formatDuration(planned)} planned.`
                : `${blocks.length} block${blocks.length === 1 ? "" : "s"} · ${formatDuration(planned)} planned.`}
          </p>
        </header>

        <div className="day-tabs" role="group" aria-label="Day">
          {WEEK_ORDER.map((d) => (
            <button key={d} type="button" aria-pressed={d === day} onClick={() => setDay(d)} data-today={d === today || undefined}>
              {DAY_NAMES[d]!.slice(0, 3)}
            </button>
          ))}
        </div>

        {schedule.length === 0 && !adding ? (
          <div className="empty">
            <strong>No schedule yet</strong>
            <p className="small">
              Add the blocks of time you set aside each day, tagged with the skill they build. Tick them off as you
              go.
            </p>
            <div className="row">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setAdding(true)}>
                Add a block
              </button>
              <button type="button" className="btn btn--sm" onClick={loadSample}>
                Start from a sample week
              </button>
            </div>
          </div>
        ) : (
          <Timeline blocks={blocks} isToday={isToday} now={now} doneIds={doneIds} />
        )}

        {adding ? (
          <BlockForm
            initial={{ days: [day] }}
            submitLabel="Add block"
            onDone={() => setAdding(false)}
          />
        ) : (
          schedule.length > 0 && (
            <div>
              <button type="button" className="btn btn--sm" onClick={() => setAdding(true)}>
                + Add a block
              </button>
            </div>
          )
        )}
      </div>

      <WeekSummary />
    </div>
  );
}

function Timeline({ blocks, isToday, now, doneIds }: { blocks: ScheduleBlock[]; isToday: boolean; now: Date; doneIds: string[] }) {
  if (blocks.length === 0) {
    return <p className="small muted timeline-empty">A free day. Pick another day above or add a block.</p>;
  }
  const items: React.ReactNode[] = [];
  let lastEnd: number | null = null;
  for (const b of blocks) {
    const start = toMinutes(b.start);
    if (lastEnd != null && start - lastEnd >= 30) {
      items.push(
        <li key={`gap-${b.id}`} className="gap" aria-hidden="true">
          free · {formatDuration(start - lastEnd)}
        </li>,
      );
    }
    lastEnd = Math.max(lastEnd ?? 0, start + durationMinutes(b));
    items.push(<BlockRow key={b.id} block={b} isToday={isToday} now={now} done={doneIds.includes(b.id)} />);
  }
  return <ol className="timeline">{items}</ol>;
}

function BlockRow({ block, isToday, now, done }: { block: ScheduleBlock; isToday: boolean; now: Date; done: boolean }) {
  const toggle = useStore((s) => s.toggleBlockDone);
  const remove = useStore((s) => s.removeBlock);
  const toast = useToast((s) => s.show);
  const [editing, setEditing] = useState(false);

  const t = now.getHours() * 60 + now.getMinutes();
  const live = isToday && isBlockNow(block, now);
  const past = isToday && !live && toMinutes(block.start) + durationMinutes(block) <= t;

  if (editing) {
    return (
      <li className="block block--editing">
        <BlockForm initial={block} id={block.id} submitLabel="Save" onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="block" data-live={live || undefined} data-past={past || undefined} data-done={done || undefined}>
      <span className="block__time num">
        {block.start}
        <span>{block.end}</span>
      </span>
      <span className="block__body">
        <span className="block__label">{block.label}</span>
        <span className="block__meta">
          <span className="num">{formatDuration(durationMinutes(block))}</span>
          {block.pillarId && (
            <Link to={`/pillar/${block.pillarId}`} className="tag">
              {PILLAR_BY_ID[block.pillarId].short}
            </Link>
          )}
          {block.days.length < 7 && <span>{daysLabel(block.days)}</span>}
        </span>
      </span>
      {live && <span className="block__now">now</span>}
      <span className="block__tools">
        {isToday && (
          <label className="block__check">
            <input type="checkbox" checked={done} onChange={() => toggle(todayISO(now), block.id)} />
            <span className="visually-hidden">Done: {block.label}</span>
          </label>
        )}
        <button type="button" className="icon-btn" aria-label={`Edit ${block.label}`} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${block.label}`}
          onClick={() => {
            const before = useStore.getState().schedule;
            remove(block.id);
            toast(`Removed “${block.label}”`, { label: "Undo", run: () => useStore.setState({ schedule: before }) });
          }}
        >
          ✕
        </button>
      </span>
    </li>
  );
}

function daysLabel(days: number[]): string {
  const set = new Set(days);
  if ([1, 2, 3, 4, 5].every((d) => set.has(d)) && days.length === 5) return "weekdays";
  if (set.has(0) && set.has(6) && days.length === 2) return "weekends";
  return WEEK_ORDER.filter((d) => set.has(d))
    .map((d) => DAY_NAMES[d]!.slice(0, 3))
    .join(", ");
}

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
];

function BlockForm({
  initial,
  id,
  submitLabel,
  onDone,
}: {
  initial: Partial<ScheduleBlock>;
  id?: string;
  submitLabel: string;
  onDone: () => void;
}) {
  const addBlock = useStore((s) => s.addBlock);
  const updateBlock = useStore((s) => s.updateBlock);
  const [start, setStart] = useState(initial.start ?? "09:00");
  const [end, setEnd] = useState(initial.end ?? "10:00");
  const [label, setLabel] = useState(initial.label ?? "");
  const [pillarId, setPillarId] = useState<PillarId | "">(initial.pillarId ?? "");
  const [days, setDays] = useState<number[]>(initial.days ?? [1, 2, 3, 4, 5]);
  const valid = label.trim() !== "" && days.length > 0 && start !== "" && end !== "" && start !== end;

  return (
    <form
      className="block-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const block = { start, end, label: label.trim(), pillarId: pillarId || null, days: [...days].sort((a, b) => a - b) };
        if (id) updateBlock(id, block);
        else addBlock(block);
        onDone();
      }}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
    >
      <label className="field block-form__label">
        What
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Rust book, chapter by chapter" autoFocus />
      </label>
      <label className="field">
        From
        <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label className="field">
        To
        <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <label className="field">
        Skill
        <select className="select" value={pillarId} onChange={(e) => setPillarId(e.target.value as PillarId | "")}>
          <option value="">— None —</option>
          {PILLARS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.short}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field block-form__days">
        <legend>Repeats on</legend>
        <div className="row">
          <div className="day-toggles">
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days.includes(d)}
                aria-label={DAY_NAMES[d]}
                onClick={() => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]))}
              >
                {DAY_NAMES[d]![0]}
              </button>
            ))}
          </div>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="btn btn--ghost btn--sm" onClick={() => setDays(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="form-actions block-form__actions">
        <button className="btn btn--primary btn--sm" type="submit" disabled={!valid}>
          {submitLabel}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onDone}>
          Cancel
        </button>
        {start !== "" && start === end && <span className="small muted">Start and end are the same.</span>}
        {start !== "" && end !== "" && toMinutes(end) < toMinutes(start) && (
          <span className="small muted">Runs past midnight.</span>
        )}
      </div>
    </form>
  );
}

function WeekSummary() {
  const schedule = useStore((s) => s.schedule);
  const scheduleDone = useStore((s) => s.scheduleDone);
  const totals = weeklyMinutesByPillar(schedule);
  const rows = [...totals.entries()].sort((a, b) => (a[0] === null ? 1 : b[0] === null ? -1 : b[1] - a[1]));
  const max = Math.max(1, ...rows.map(([, m]) => m));
  const total = rows.reduce((n, [, m]) => n + m, 0);

  const streak = (() => {
    let n = 0;
    const d = new Date();
    if (!scheduleDone[todayISO(d)]?.length) d.setDate(d.getDate() - 1);
    while (scheduleDone[todayISO(d)]?.length) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  if (schedule.length === 0) return <aside />;

  return (
    <aside className="margin-notes" aria-label="Week at a glance">
      <div className="note">
        <span className="note__label">each week</span>
        <p className="big-figure num">
          {formatDuration(total)}
          <small> planned</small>
        </p>
        <ul className="hours">
          {rows.map(([pid, m]) => (
            <li key={pid ?? "none"}>
              <span className="hours__name">
                {pid ? <Link to={`/pillar/${pid}`}>{PILLAR_BY_ID[pid].short}</Link> : <span className="muted">Untagged</span>}
                <span className="num muted">{formatDuration(m)}</span>
              </span>
              <span className="hours__bar" style={{ "--w": m / max } as React.CSSProperties} data-none={pid ? undefined : true} />
            </li>
          ))}
        </ul>
      </div>
      <div className="note">
        <span className="note__label">streak</span>
        <p className="big-figure num">
          {streak}
          <small> day{streak === 1 ? "" : "s"}</small>
        </p>
        <p className="small muted">in a row with at least one block ticked off.</p>
      </div>
    </aside>
  );
}
