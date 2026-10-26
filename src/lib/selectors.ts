import { useMemo } from "react";
import { NEETCODE_150 } from "../data/neetcode";
import { useStore } from "../store";
import type { Book, ChecklistItem, PillarStatus, Problem } from "../types";

export const PILLAR_STATUS: { id: PillarStatus; label: string }[] = [
  { id: "not-started", label: "Not started" },
  { id: "in-progress", label: "In progress" },
  { id: "done", label: "Done" },
];

export const BOOK_STATUS = [
  { id: "want", label: "Up next" },
  { id: "reading", label: "Reading" },
  { id: "finished", label: "Finished" },
  { id: "abandoned", label: "Set aside" },
] as const;

export function bookProgress(book: Book | undefined | null): number | null {
  if (!book) return null;
  if (book.status === "finished") return 1;
  if (!book.totalChapters) return null;
  return Math.min(1, book.currentChapter / book.totalChapters);
}

export function progressLabel(book: Book): string {
  if (book.status === "finished") return "Finished";
  if (book.totalChapters) return `${book.currentChapter} of ${book.totalChapters} chapters`;
  return book.currentChapter ? `${book.currentChapter} chapter${book.currentChapter === 1 ? "" : "s"} done` : "Not started";
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return items.filter((i) => i.doneAt).length / items.length;
}

export function useAllProblems(): Problem[] {
  const custom = useStore((s) => s.customProblems);
  return useMemo(() => [...NEETCODE_150, ...custom], [custom]);
}
