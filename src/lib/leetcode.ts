import type { Attempt, Problem, Rating } from "../types";

export const RATINGS: { id: Rating; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "Solved quickly, no hints" },
  { id: "good", label: "Good", hint: "Solved with some thought" },
  { id: "hard", label: "Hard", hint: "Struggled, but got there" },
  { id: "failed", label: "Failed", hint: "Needed the solution" },
];

export interface ProblemStat {
  count: number;
  last: Attempt | null;
}

/** Attempts are stored newest-first; the first one seen per problem is the latest. */
export function buildStats(attempts: Attempt[]): Map<string, ProblemStat> {
  const stats = new Map<string, ProblemStat>();
  for (const a of attempts) {
    const s = stats.get(a.problemId);
    if (s) {
      s.count += 1;
      if (s.last && a.at > s.last.at) s.last = a;
    } else {
      stats.set(a.problemId, { count: 1, last: a });
    }
  }
  return stats;
}

export type PickMode = "smart" | "new" | "review" | "any";

export const PICK_MODES: { id: PickMode; label: string; hint: string }[] = [
  { id: "smart", label: "Smart", hint: "Favours unseen problems and ones you struggled with" },
  { id: "new", label: "Unseen", hint: "Only problems you haven’t attempted" },
  { id: "review", label: "Review", hint: "Only problems last rated hard or failed" },
  { id: "any", label: "Any", hint: "Uniformly random" },
];

const RATING_WEIGHT: Record<Rating, number> = { failed: 5, hard: 4, good: 1.5, easy: 0.5 };

export function weightFor(stat: ProblemStat | undefined, now: number): number {
  if (!stat?.last) return 3;
  const days = Math.max(0, (now - new Date(stat.last.at).getTime()) / 86_400_000);
  // Problems you haven't seen in a while drift back up.
  return RATING_WEIGHT[stat.last.rating] * (1 + Math.min(days, 30) / 10);
}

export function candidatesFor(pool: Problem[], stats: Map<string, ProblemStat>, mode: PickMode): Problem[] {
  switch (mode) {
    case "new":
      return pool.filter((p) => !stats.has(p.id));
    case "review":
      return pool.filter((p) => {
        const r = stats.get(p.id)?.last?.rating;
        return r === "hard" || r === "failed";
      });
    default:
      return pool;
  }
}

export function pickProblem(
  pool: Problem[],
  stats: Map<string, ProblemStat>,
  mode: PickMode,
  opts: { excludeId?: string | null; random?: () => number; now?: number } = {},
): Problem | null {
  const random = opts.random ?? Math.random;
  const now = opts.now ?? Date.now();
  let candidates = candidatesFor(pool, stats, mode);
  if (candidates.length > 1 && opts.excludeId) {
    candidates = candidates.filter((p) => p.id !== opts.excludeId);
  }
  if (candidates.length === 0) return null;

  if (mode !== "smart") {
    return candidates[Math.floor(random() * candidates.length)] ?? null;
  }

  const weights = candidates.map((p) => weightFor(stats.get(p.id), now));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]!;
    if (r < 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}
