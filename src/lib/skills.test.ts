import { describe, expect, it } from "vitest";
import type { Book, PillarState, Rung } from "../types";
import { durationMinutes, isBlockNow, weeklyMinutesByPillar } from "./schedule";
import { rankFor, rungParts, summarize } from "./skills";

function rung(patch: Partial<Rung> = {}): Rung {
  return {
    id: Math.random().toString(36),
    label: "x",
    url: "",
    track: "",
    bookId: null,
    chapters: null,
    chaptersDone: 0,
    unit: "chapter",
    chapterTitles: [],
    related: [],
    startedAt: null,
    doneAt: null,
    ...patch,
  };
}

function pillar(rungs: Rung[]): PillarState {
  return { id: "os", bookId: null, rungs, resources: [], notes: "" };
}

describe("summarize", () => {
  it("counts levels and partial book progress", () => {
    const book = { id: "b", status: "reading", totalChapters: 10, currentChapter: 5 } as Book;
    const s = summarize(pillar([rung({ doneAt: "2026-01-01" }), rung({ bookId: "b" }), rung()]), new Map([["b", book]]));
    expect(s.level).toBe(1);
    expect(s.max).toBe(3);
    expect(s.progress).toBeCloseTo(0.5);
    expect(s.next?.bookId).toBe("b");
  });

  it("counts a step’s own parts", () => {
    const s = summarize(pillar([rung({ chapters: 4, chaptersDone: 1 }), rung()]), new Map());
    expect(s.progress).toBeCloseTo(0.125);
    expect(s.steps).toEqual(["doing", "todo"]);
  });

  it("treats a done step as fully read", () => {
    expect(rungParts(rung({ chapters: 5, chaptersDone: 2, doneAt: "x" }))).toMatchObject({ total: 5, done: 5 });
  });

  it("groups tracks", () => {
    const s = summarize(pillar([rung({ track: "A", doneAt: "x" }), rung({ track: "A" }), rung({ track: "B" })]), new Map());
    expect(s.tracks).toEqual([
      { name: "A", level: 1, max: 2, progress: 0.5 },
      { name: "B", level: 0, max: 1, progress: 0 },
    ]);
  });

  it("handles an empty ladder", () => {
    expect(summarize(pillar([]), new Map())).toMatchObject({ level: 0, max: 0, progress: 0, next: null });
  });
});

describe("rankFor", () => {
  it("scales with the ladder", () => {
    expect(rankFor(0, 4)).toBe("Not started");
    expect(rankFor(1, 5)).toBe("Novice");
    expect(rankFor(1, 4)).toBe("Apprentice");
    expect(rankFor(3, 4)).toBe("Adept");
    expect(rankFor(4, 4)).toBe("Mastered");
    expect(rankFor(0, 0)).toBe("Unranked");
  });
});

describe("schedule", () => {
  it("handles blocks past midnight", () => {
    expect(durationMinutes({ start: "23:00", end: "01:00" })).toBe(120);
    expect(durationMinutes({ start: "09:00", end: "09:30" })).toBe(30);
  });

  it("knows what’s on now", () => {
    const block = { id: "a", start: "09:00", end: "10:00", label: "", pillarId: null, days: [3] };
    expect(isBlockNow(block, new Date(2026, 9, 28, 9, 30))).toBe(true); // a Wednesday
    expect(isBlockNow(block, new Date(2026, 9, 28, 10, 0))).toBe(false);
    expect(isBlockNow(block, new Date(2026, 9, 29, 9, 30))).toBe(false);
  });

  it("totals weekly minutes per pillar", () => {
    const totals = weeklyMinutesByPillar([
      { id: "a", start: "09:00", end: "10:00", label: "", pillarId: "os", days: [1, 2] },
      { id: "b", start: "12:00", end: "12:30", label: "", pillarId: "os", days: [3] },
    ]);
    expect(totals.get("os")).toBe(150);
  });
});
