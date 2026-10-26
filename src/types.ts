export type PillarId =
  | "programming"
  | "architecture"
  | "algorithms"
  | "math"
  | "os"
  | "networking"
  | "databases"
  | "languages"
  | "distributed";

export type PillarStatus = "not-started" | "in-progress" | "done";

export interface Resource {
  id: string;
  label: string;
  url: string;
}

export interface PillarState {
  id: PillarId;
  status: PillarStatus;
  bookId: string | null;
  resources: Resource[];
  notes: string;
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
  status: BookStatus;
  pillarId: PillarId | null;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
  entries: ReadingEntry[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
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
