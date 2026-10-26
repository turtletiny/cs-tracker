import { describe, expect, it } from "vitest";
import type { Attempt, Problem } from "../types";
import { buildStats, candidatesFor, pickProblem, weightFor } from "./leetcode";

const problem = (id: string): Problem => ({
  id,
  title: id,
  topic: "stack",
  difficulty: "Easy",
  url: `https://leetcode.com/problems/${id}/`,
});

const attempt = (problemId: string, rating: Attempt["rating"], at: string): Attempt => ({
  id: `${problemId}-${at}`,
  problemId,
  rating,
  at,
});

describe("buildStats", () => {
  it("counts attempts and keeps the latest one", () => {
    const stats = buildStats([
      attempt("a", "good", "2026-01-03T00:00:00Z"),
      attempt("a", "failed", "2026-01-01T00:00:00Z"),
      attempt("b", "easy", "2026-01-02T00:00:00Z"),
    ]);
    expect(stats.get("a")).toMatchObject({ count: 2, last: { rating: "good" } });
    expect(stats.get("b")?.count).toBe(1);
  });
});

describe("candidatesFor", () => {
  const pool = [problem("a"), problem("b"), problem("c")];
  const stats = buildStats([
    attempt("a", "failed", "2026-01-01T00:00:00Z"),
    attempt("b", "easy", "2026-01-01T00:00:00Z"),
  ]);

  it("filters unseen problems", () => {
    expect(candidatesFor(pool, stats, "new").map((p) => p.id)).toEqual(["c"]);
  });

  it("filters problems needing review", () => {
    expect(candidatesFor(pool, stats, "review").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("pickProblem", () => {
  it("returns null when nothing matches", () => {
    expect(pickProblem([], new Map(), "smart")).toBeNull();
  });

  it("avoids repeating the excluded problem when possible", () => {
    const pool = [problem("a"), problem("b")];
    for (let i = 0; i < 20; i++) {
      expect(pickProblem(pool, new Map(), "any", { excludeId: "a" })?.id).toBe("b");
    }
  });

  it("still returns the only candidate even if excluded", () => {
    expect(pickProblem([problem("a")], new Map(), "any", { excludeId: "a" })?.id).toBe("a");
  });

  it("weights failed problems above easy ones", () => {
    const now = new Date("2026-01-01T00:00:00Z").getTime();
    const stats = buildStats([
      attempt("a", "failed", "2026-01-01T00:00:00Z"),
      attempt("b", "easy", "2026-01-01T00:00:00Z"),
    ]);
    expect(weightFor(stats.get("a"), now)).toBeGreaterThan(weightFor(stats.get("b"), now));
    // random() = 0 always lands on the first candidate's slice
    expect(pickProblem([problem("a"), problem("b")], stats, "smart", { random: () => 0, now })?.id).toBe("a");
  });
});
