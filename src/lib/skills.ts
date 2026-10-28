import { useMemo } from "react";
import { PILLARS } from "../data/pillars";
import { useStore } from "../store";
import type { Book, PillarId, PillarState, Rung } from "../types";

export type RungStatus = "todo" | "doing" | "done";

export interface RungParts {
  /** null when the step is a single milestone. */
  total: number | null;
  done: number;
  titles: string[];
  unit: string;
}

/** A step’s parts: from its linked book if it has one, otherwise its own. */
export function rungParts(rung: Rung, book?: Book | null): RungParts {
  const source = book
    ? { total: book.totalChapters, done: book.status === "finished" ? Infinity : book.currentChapter, titles: book.chapterTitles ?? [], unit: "chapter" }
    : { total: rung.chapters, done: rung.chaptersDone, titles: rung.chapterTitles, unit: rung.unit || "chapter" };
  const total = source.total || null;
  const done = total == null ? 0 : rung.doneAt ? total : Math.min(total, Math.max(0, source.done));
  return { total, done, titles: source.titles, unit: source.unit };
}

export function rungStatus(rung: Rung, book?: Book | null): RungStatus {
  if (rung.doneAt) return "done";
  if (rung.startedAt || book?.status === "reading" || rungParts(rung, book).done > 0) return "doing";
  return "todo";
}

/** 0–1. Parts done count as partial progress. */
export function rungProgress(rung: Rung, book?: Book | null): number {
  if (rung.doneAt) return 1;
  const { total, done } = rungParts(rung, book);
  return total ? Math.min(0.99, done / total) : 0;
}

const RANKS: [number, string][] = [
  [0.25, "Novice"],
  [0.5, "Apprentice"],
  [0.75, "Practitioner"],
  [1, "Adept"],
];

export function rankFor(level: number, max: number): string {
  if (max === 0) return "Unranked";
  if (level === 0) return "Not started";
  if (level >= max) return "Mastered";
  const f = level / max;
  return RANKS.find(([limit]) => f < limit)?.[1] ?? "Adept";
}

export interface TrackSummary {
  name: string;
  level: number;
  max: number;
  progress: number;
}

export interface SkillSummary {
  level: number;
  max: number;
  /** 0–1 including partial progress on books. */
  progress: number;
  rank: string;
  /** First rung in progress, otherwise the first rung not yet done. */
  next: Rung | null;
  nextIndex: number;
  /** Status and track of every rung, in ladder order. */
  steps: RungStatus[];
  trackOf: string[];
  tracks: TrackSummary[];
}

export function summarize(pillar: PillarState, bookById: Map<string, Book>): SkillSummary {
  const { rungs } = pillar;
  const bookOf = (r: Rung) => (r.bookId ? bookById.get(r.bookId) : undefined);
  const level = rungs.filter((r) => r.doneAt).length;
  const max = rungs.length;
  const progress = max === 0 ? 0 : rungs.reduce((sum, r) => sum + rungProgress(r, bookOf(r)), 0) / max;
  const steps = rungs.map((r) => rungStatus(r, bookOf(r)));
  const doing = steps.indexOf("doing");
  const nextIndex = doing >= 0 ? doing : steps.indexOf("todo");
  const next = rungs[nextIndex] ?? null;

  const trackNames = [...new Set(rungs.map((r) => r.track).filter(Boolean))];
  const tracks = trackNames.map((name) => {
    const inTrack = rungs.filter((r) => r.track === name);
    return {
      name,
      level: inTrack.filter((r) => r.doneAt).length,
      max: inTrack.length,
      progress: inTrack.reduce((sum, r) => sum + rungProgress(r, bookOf(r)), 0) / inTrack.length,
    };
  });

  const trackOf = rungs.map((r) => r.track);
  return { level, max, progress, rank: rankFor(level, max), next, nextIndex, steps, trackOf, tracks };
}

export function useBookMap(): Map<string, Book> {
  const books = useStore((s) => s.books);
  return useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
}

export function useSkills(): Record<PillarId, SkillSummary> {
  const pillars = useStore((s) => s.pillars);
  const bookById = useBookMap();
  return useMemo(
    () => Object.fromEntries(PILLARS.map((p) => [p.id, summarize(pillars[p.id], bookById)])) as Record<PillarId, SkillSummary>,
    [pillars, bookById],
  );
}

export interface Thread {
  a: PillarId;
  b: PillarId;
  rungs: { pillarId: PillarId; rung: Rung }[];
}

/** Pairs of pillars bridged by a rung that lists the other as related. */
export function findThreads(pillars: Record<PillarId, PillarState>): Thread[] {
  const byPair = new Map<string, Thread>();
  for (const seed of PILLARS) {
    for (const rung of pillars[seed.id]?.rungs ?? []) {
      for (const other of rung.related) {
        if (other === seed.id) continue;
        const [a, b] = [seed.id, other].sort() as [PillarId, PillarId];
        const key = `${a}|${b}`;
        const t = byPair.get(key) ?? { a, b, rungs: [] };
        t.rungs.push({ pillarId: seed.id, rung });
        byPair.set(key, t);
      }
    }
  }
  return [...byPair.values()];
}
