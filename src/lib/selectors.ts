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
  if (!book.totalPages) return null;
  return Math.min(1, book.currentPage / book.totalPages);
}

export function pageLabel(book: Book): string {
  if (book.status === "finished") return "Finished";
  if (book.totalPages) return `p. ${book.currentPage} of ${book.totalPages}`;
  return book.currentPage ? `p. ${book.currentPage}` : "Not started";
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return items.filter((i) => i.doneAt).length / items.length;
}

export function useAllProblems(): Problem[] {
  const custom = useStore((s) => s.customProblems);
  return useMemo(() => [...NEETCODE_150, ...custom], [custom]);
}
