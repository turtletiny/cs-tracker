import type { PillarId, ScheduleBlock } from "../types";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Monday-first display order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Blocks that end at or before they start are treated as running past midnight. */
export function durationMinutes(block: Pick<ScheduleBlock, "start" | "end">): number {
  const d = toMinutes(block.end) - toMinutes(block.start);
  return d > 0 ? d : d + 24 * 60;
}

export function blocksForDay(blocks: ScheduleBlock[], day: number): ScheduleBlock[] {
  return blocks.filter((b) => b.days.includes(day)).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export function isBlockNow(block: ScheduleBlock, now: Date): boolean {
  if (!block.days.includes(now.getDay())) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(block.start);
  return t >= start && t < start + durationMinutes(block);
}

/** The block running now, or else the next one still to come today. */
export function currentOrNext(blocks: ScheduleBlock[], now: Date): { block: ScheduleBlock; now: boolean } | null {
  const today = blocksForDay(blocks, now.getDay());
  const running = today.find((b) => isBlockNow(b, now));
  if (running) return { block: running, now: true };
  const t = now.getHours() * 60 + now.getMinutes();
  const upcoming = today.find((b) => toMinutes(b.start) > t);
  return upcoming ? { block: upcoming, now: false } : null;
}

export function weeklyMinutesByPillar(blocks: ScheduleBlock[]): Map<PillarId | null, number> {
  const out = new Map<PillarId | null, number>();
  for (const b of blocks) {
    out.set(b.pillarId, (out.get(b.pillarId) ?? 0) + durationMinutes(b) * b.days.length);
  }
  return out;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
