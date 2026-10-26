import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DSA_CHECKLIST } from "./data/dsaChecklist";
import { DEFAULT_LEARNT_TOPICS } from "./data/neetcode";
import { PILLARS } from "./data/pillars";
import { todayISO, uid } from "./lib/util";
import type {
  Attempt,
  Book,
  ChecklistItem,
  PillarId,
  PillarState,
  PillarStatus,
  Problem,
  Rating,
  ReadingEntry,
  Resource,
  TopicId,
} from "./types";

export interface AppData {
  pillars: Record<PillarId, PillarState>;
  books: Book[];
  checklist: ChecklistItem[];
  customProblems: Problem[];
  attempts: Attempt[];
  learntTopics: TopicId[];
}

interface Actions {
  setPillarStatus: (id: PillarId, status: PillarStatus) => void;
  setPillarNotes: (id: PillarId, notes: string) => void;
  setPillarBook: (id: PillarId, bookId: string | null) => void;
  addResource: (id: PillarId, label: string, url: string) => void;
  updateResource: (id: PillarId, resourceId: string, patch: Partial<Omit<Resource, "id">>) => void;
  removeResource: (id: PillarId, resourceId: string) => void;
  moveResource: (id: PillarId, resourceId: string, delta: -1 | 1) => void;

  addBook: (book: Partial<Omit<Book, "id" | "entries" | "createdAt">> & { title: string }) => string;
  updateBook: (id: string, patch: Partial<Omit<Book, "id" | "entries">>) => void;
  removeBook: (id: string) => void;
  logReading: (bookId: string, entry: Omit<ReadingEntry, "id">) => void;
  removeReadingEntry: (bookId: string, entryId: string) => void;

  toggleChecklistItem: (id: string) => void;
  addChecklistItem: (group: string, label: string) => void;
  removeChecklistItem: (id: string) => void;

  toggleTopic: (topic: TopicId) => void;
  rateProblem: (problemId: string, rating: Rating) => void;
  removeAttempt: (id: string) => void;
  addCustomProblem: (problem: Omit<Problem, "id" | "custom">) => void;
  removeCustomProblem: (id: string) => void;

  importData: (data: AppData) => void;
  resetAll: () => void;
}

export type AppState = AppData & Actions;

export function createInitialData(): AppData {
  const now = new Date().toISOString();
  const books: Book[] = PILLARS.map((p) => ({
    id: `book-${p.id}`,
    title: p.book.title,
    author: p.book.author,
    coverUrl: p.book.cover,
    totalChapters: p.book.chapters,
    currentChapter: 0,
    status: "want",
    pillarId: p.id,
    startedAt: null,
    finishedAt: null,
    rating: null,
    entries: [],
    createdAt: now,
  }));

  const pillars = Object.fromEntries(
    PILLARS.map((p) => [
      p.id,
      {
        id: p.id,
        status: "not-started",
        bookId: `book-${p.id}`,
        resources: p.resources.map((r) => ({ id: uid(), ...r })),
        notes: "",
      } satisfies PillarState,
    ]),
  ) as Record<PillarId, PillarState>;

  const checklist: ChecklistItem[] = Object.entries(DSA_CHECKLIST).flatMap(([group, labels]) =>
    labels.map((label) => ({ id: uid(), group, label, doneAt: null })),
  );

  return {
    pillars,
    books,
    checklist,
    customProblems: [],
    attempts: [],
    learntTopics: [...DEFAULT_LEARNT_TOPICS],
  };
}

export function pickData(state: AppState): AppData {
  const { pillars, books, checklist, customProblems, attempts, learntTopics } = state;
  return { pillars, books, checklist, customProblems, attempts, learntTopics };
}

type LegacyBook = Book & { totalPages?: number | null; currentPage?: number };
type LegacyEntry = ReadingEntry & { page?: number | null };

/**
 * v1 tracked progress in pages; v2 tracks chapters. Seeded books get their
 * chapter count and an estimated chapter from the page ratio. Other books
 * keep their sessions but need a chapter count entered by hand.
 */
export function migrateData(data: AppData): AppData {
  const seedChapters = new Map(PILLARS.map((p) => [`book-${p.id}`, p.book.chapters]));
  const books = data.books.map((raw) => {
    const b = raw as LegacyBook;
    if (!("totalPages" in b) && !("currentPage" in b)) return b;
    const { totalPages, currentPage, ...rest } = b;
    const totalChapters = b.totalChapters ?? seedChapters.get(b.id) ?? null;
    const currentChapter =
      b.status === "finished" && totalChapters
        ? totalChapters
        : totalChapters && totalPages && currentPage
          ? Math.min(totalChapters, Math.floor((currentPage / totalPages) * totalChapters))
          : 0;
    const entries = b.entries.map((e) => {
      const { page: _page, ...entry } = e as LegacyEntry;
      return { ...entry, chapter: entry.chapter ?? null };
    });
    return { ...rest, totalChapters, currentChapter, entries } as Book;
  });
  return { ...data, books };
}

/** Loose structural check for imported backups. */
export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.pillars === "object" &&
    v.pillars !== null &&
    Array.isArray(v.books) &&
    Array.isArray(v.checklist) &&
    Array.isArray(v.customProblems) &&
    Array.isArray(v.attempts) &&
    Array.isArray(v.learntTopics)
  );
}

function patchPillar(state: AppState, id: PillarId, fn: (p: PillarState) => PillarState) {
  return { pillars: { ...state.pillars, [id]: fn(state.pillars[id]) } };
}

function applyReading(book: Book, entry: ReadingEntry): Book {
  const next: Book = { ...book, entries: [entry, ...book.entries].sort((a, b) => b.date.localeCompare(a.date)) };
  if (entry.chapter != null) {
    next.currentChapter = Math.max(0, entry.chapter);
  }
  if (next.status === "want") next.status = "reading";
  if (!next.startedAt) next.startedAt = entry.date;
  if (next.totalChapters && next.currentChapter >= next.totalChapters && next.status !== "finished") {
    next.currentChapter = next.totalChapters;
    next.status = "finished";
    next.finishedAt = entry.date;
  }
  return next;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createInitialData(),

      setPillarStatus: (id, status) => set((s) => patchPillar(s, id, (p) => ({ ...p, status }))),
      setPillarNotes: (id, notes) => set((s) => patchPillar(s, id, (p) => ({ ...p, notes }))),
      setPillarBook: (id, bookId) => set((s) => patchPillar(s, id, (p) => ({ ...p, bookId }))),
      addResource: (id, label, url) =>
        set((s) => patchPillar(s, id, (p) => ({ ...p, resources: [...p.resources, { id: uid(), label, url }] }))),
      updateResource: (id, resourceId, patch) =>
        set((s) =>
          patchPillar(s, id, (p) => ({
            ...p,
            resources: p.resources.map((r) => (r.id === resourceId ? { ...r, ...patch } : r)),
          })),
        ),
      removeResource: (id, resourceId) =>
        set((s) => patchPillar(s, id, (p) => ({ ...p, resources: p.resources.filter((r) => r.id !== resourceId) }))),
      moveResource: (id, resourceId, delta) =>
        set((s) =>
          patchPillar(s, id, (p) => {
            const i = p.resources.findIndex((r) => r.id === resourceId);
            const j = i + delta;
            if (i < 0 || j < 0 || j >= p.resources.length) return p;
            const resources = [...p.resources];
            [resources[i], resources[j]] = [resources[j]!, resources[i]!];
            return { ...p, resources };
          }),
        ),

      addBook: (book) => {
        const id = uid();
        set((s) => ({
          books: [
            {
              author: "",
              coverUrl: "",
              totalChapters: null,
              currentChapter: 0,
              status: "want",
              pillarId: null,
              startedAt: null,
              finishedAt: null,
              rating: null,
              ...book,
              id,
              entries: [],
              createdAt: new Date().toISOString(),
            },
            ...s.books,
          ],
        }));
        return id;
      },
      updateBook: (id, patch) =>
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== id) return b;
            const next = { ...b, ...patch };
            if (patch.status === "reading" && !next.startedAt) next.startedAt = todayISO();
            if (patch.status === "finished") {
              next.finishedAt = next.finishedAt ?? todayISO();
              if (next.totalChapters) next.currentChapter = next.totalChapters;
            }
            return next;
          }),
        })),
      removeBook: (id) =>
        set((s) => ({
          books: s.books.filter((b) => b.id !== id),
          pillars: Object.fromEntries(
            Object.entries(s.pillars).map(([pid, p]) => [pid, p.bookId === id ? { ...p, bookId: null } : p]),
          ) as Record<PillarId, PillarState>,
        })),
      logReading: (bookId, entry) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === bookId ? applyReading(b, { ...entry, id: uid() }) : b)),
        })),
      removeReadingEntry: (bookId, entryId) =>
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== bookId) return b;
            const entries = b.entries.filter((e) => e.id !== entryId);
            const latest = entries.find((e) => e.chapter != null)?.chapter ?? 0;
            return { ...b, entries, currentChapter: latest };
          }),
        })),

      toggleChecklistItem: (id) =>
        set((s) => ({
          checklist: s.checklist.map((c) =>
            c.id === id ? { ...c, doneAt: c.doneAt ? null : new Date().toISOString() } : c,
          ),
        })),
      addChecklistItem: (group, label) =>
        set((s) => {
          const item = { id: uid(), group, label, doneAt: null };
          let lastIdx = -1;
          s.checklist.forEach((c, i) => {
            if (c.group === group) lastIdx = i;
          });
          const checklist = [...s.checklist];
          checklist.splice(lastIdx < 0 ? checklist.length : lastIdx + 1, 0, item);
          return { checklist };
        }),
      removeChecklistItem: (id) => set((s) => ({ checklist: s.checklist.filter((c) => c.id !== id) })),

      toggleTopic: (topic) =>
        set((s) => ({
          learntTopics: s.learntTopics.includes(topic)
            ? s.learntTopics.filter((t) => t !== topic)
            : [...s.learntTopics, topic],
        })),
      rateProblem: (problemId, rating) =>
        set((s) => ({
          attempts: [{ id: uid(), problemId, rating, at: new Date().toISOString() }, ...s.attempts],
        })),
      removeAttempt: (id) => set((s) => ({ attempts: s.attempts.filter((a) => a.id !== id) })),
      addCustomProblem: (problem) =>
        set((s) => ({
          customProblems: [...s.customProblems, { ...problem, id: `custom-${uid()}`, custom: true }],
        })),
      removeCustomProblem: (id) =>
        set((s) => ({
          customProblems: s.customProblems.filter((p) => p.id !== id),
          attempts: s.attempts.filter((a) => a.problemId !== id),
        })),

      importData: (data) => set(() => ({ ...createInitialData(), ...migrateData(data) })),
      resetAll: () => set(() => createInitialData()),
    }),
    {
      name: "cs-tracker",
      version: 2,
      partialize: (s) => pickData(s),
      migrate: (persisted) => migrateData(persisted as AppData),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<AppData>;
        // Keep any pillars added in newer versions of the app.
        return { ...current, ...p, pillars: { ...current.pillars, ...(p.pillars ?? {}) } };
      },
    },
  ),
);
