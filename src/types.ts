export type PillarId =
  | "programming"
  | "architecture"
  | "algorithms"
  | "math"
  | "os"
  | "networking"
  | "databases"
  | "languages"
  | "distributed"
  | "interview";

export interface Resource {
  id: string;
  label: string;
  url: string;
}

/**
 * One resource on a pillar's roadmap. It shows as one node per chapter (or
 * other part) followed by a completion milestone, or as a lone milestone if
 * it has no parts.
 */
export interface Rung {
  id: string;
  label: string;
  url: string;
  /** Optional sub-track within the pillar, e.g. "Behavioural". */
  track: string;
  /** When set, chapters and progress come from this book instead of the fields below. */
  bookId: string | null;
  /** Number of parts, or null for a single milestone. */
  chapters: number | null;
  chaptersDone: number;
  /** What a part is called: "chapter", "project", "lab"… */
  unit: string;
  chapterTitles: string[];
  /** Other pillars this step also builds. */
  related: PillarId[];
  startedAt: string | null;
  doneAt: string | null;
}

export interface PillarState {
  id: PillarId;
  bookId: string | null;
  rungs: Rung[];
  resources: Resource[];
  notes: string;
}

export interface Story {
  id: string;
  title: string;
  themes: string[];
  notes: string;
  practisedAt: string | null;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  /** HH:MM, 24-hour */
  start: string;
  end: string;
  label: string;
  pillarId: PillarId | null;
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
}

export type BookStatus = "want" | "reading" | "finished" | "abandoned";

export interface ReadingEntry {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  /** Chapters completed as of the end of the session. */
  chapter: number | null;
  minutes: number | null;
  note: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalChapters: number | null;
  currentChapter: number;
  chapterTitles?: string[];
  status: BookStatus;
  pillarId: PillarId | null;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
  entries: ReadingEntry[];
  createdAt: string;
}

export type ChecklistId = "dsa" | "system-design";

export interface ChecklistItem {
  id: string;
  list: ChecklistId;
  group: string;
  label: string;
  doneAt: string | null;
}

export type TopicId =
  | "arrays-hashing"
  | "two-pointers"
  | "sliding-window"
  | "stack"
  | "binary-search"
  | "linked-list"
  | "trees"
  | "tries"
  | "heap"
  | "backtracking"
  | "graphs"
  | "advanced-graphs"
  | "dp-1d"
  | "dp-2d"
  | "greedy"
  | "intervals"
  | "math-geometry"
  | "bit-manipulation";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  id: string;
  title: string;
  topic: TopicId;
  difficulty: Difficulty;
  url: string;
  custom?: boolean;
}

export type Rating = "easy" | "good" | "hard" | "failed";

export interface Attempt {
  id: string;
  problemId: string;
  rating: Rating;
  /** ISO timestamp */
  at: string;
}
