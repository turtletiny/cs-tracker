import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DSA_CHECKLIST } from "./data/dsaChecklist";
import { SYSTEM_DESIGN_CHECKLIST } from "./data/interview";
import { DEFAULT_LEARNT_TOPICS } from "./data/neetcode";
import { BOOK_CHAPTERS } from "./data/chapters";
import { EXTRA_BOOKS, PILLAR_BY_ID, PILLARS, type BookSeed, type PillarSeed, type RungSeed } from "./data/pillars";
import { SAMPLE_SCHEDULE } from "./data/schedule";
import { clamp, todayISO, uid } from "./lib/util";
import type {
  Attempt,
  Book,
  ChecklistId,
  ChecklistItem,
  PillarId,
  PillarState,
  Problem,
  Rating,
  ReadingEntry,
  Resource,
  Rung,
  ScheduleBlock,
  Story,
  TopicId,
} from "./types";

export interface AppData {
  pillars: Record<PillarId, PillarState>;
  books: Book[];
  checklist: ChecklistItem[];
  customProblems: Problem[];
  attempts: Attempt[];
  learntTopics: TopicId[];
  stories: Story[];
  schedule: ScheduleBlock[];
  /** yyyy-mm-dd → ids of blocks ticked off that day */
  scheduleDone: Record<string, string[]>;
}

export type RungInput = Pick<Rung, "label"> &
  Partial<Pick<Rung, "url" | "track" | "bookId" | "related" | "chapters" | "unit" | "chapterTitles">>;

interface Actions {
  setPillarNotes: (id: PillarId, notes: string) => void;
  setPillarBook: (id: PillarId, bookId: string | null) => void;
  addResource: (id: PillarId, label: string, url: string) => void;
  updateResource: (id: PillarId, resourceId: string, patch: Partial<Omit<Resource, "id">>) => void;
  removeResource: (id: PillarId, resourceId: string) => void;
  moveResource: (id: PillarId, resourceId: string, delta: -1 | 1) => void;

  addRung: (id: PillarId, rung: RungInput) => void;
  updateRung: (id: PillarId, rungId: string, patch: Partial<Omit<Rung, "id">>) => void;
  removeRung: (id: PillarId, rungId: string) => void;
  moveRung: (id: PillarId, rungId: string, delta: -1 | 1) => void;
  toggleRungDone: (id: PillarId, rungId: string) => void;
  /** Starting a book-linked step puts the book on the reading shelf; un-starting before reading any takes it off. */
  setRungStarted: (id: PillarId, rungId: string, started: boolean) => void;
  /** Mark the first `done` parts of a step complete (and the rest not). Updates a linked book too. */
  setRungProgress: (id: PillarId, rungId: string, done: number) => void;
  toggleRungStarted: (id: PillarId, rungId: string) => void;

  addBook: (book: Partial<Omit<Book, "id" | "entries" | "createdAt">> & { title: string }) => string;
  updateBook: (id: string, patch: Partial<Omit<Book, "id" | "entries">>) => void;
  removeBook: (id: string) => void;
  logReading: (bookId: string, entry: Omit<ReadingEntry, "id">) => void;
  removeReadingEntry: (bookId: string, entryId: string) => void;

  toggleChecklistItem: (id: string) => void;
  addChecklistItem: (list: ChecklistId, group: string, label: string) => void;
  removeChecklistItem: (id: string) => void;

  toggleTopic: (topic: TopicId) => void;
  rateProblem: (problemId: string, rating: Rating) => void;
  removeAttempt: (id: string) => void;
  addCustomProblem: (problem: Omit<Problem, "id" | "custom">) => void;
  removeCustomProblem: (id: string) => void;

  addStory: (title: string, themes: string[]) => void;
  updateStory: (id: string, patch: Partial<Omit<Story, "id" | "createdAt">>) => void;
  removeStory: (id: string) => void;

  addBlock: (block: Omit<ScheduleBlock, "id">) => void;
  updateBlock: (id: string, patch: Partial<Omit<ScheduleBlock, "id">>) => void;
  removeBlock: (id: string) => void;
  toggleBlockDone: (date: string, blockId: string) => void;
  loadSampleSchedule: () => void;

  importData: (data: AppData) => void;
  resetAll: () => void;
}

export type AppState = AppData & Actions;

function seedBookId(pillarId: PillarId, r: RungSeed): string | null {
  return r.book === true ? `book-${pillarId}` : (r.book ?? null);
}

function partsFromSeed(r: RungSeed) {
  return {
    chapters: r.parts?.titles.length ?? null,
    unit: r.parts?.unit ?? "chapter",
    chapterTitles: r.parts?.titles ?? [],
  };
}

function seedRungs(seed: PillarSeed, now: string): Rung[] {
  return seed.rungs.map((r) => ({
    id: uid(),
    label: r.label,
    url: r.url ?? "",
    track: r.track ?? "",
    bookId: seedBookId(seed.id, r),
    ...partsFromSeed(r),
    chaptersDone: 0,
    related: r.related ?? [],
    startedAt: r.current ? now : null,
    doneAt: null,
  }));
}

const BOOK_SEEDS: BookSeed[] = [
  ...PILLARS.map((p) => ({ id: `book-${p.id}`, pillarId: p.id, ...p.book })),
  ...EXTRA_BOOKS,
];

function seedBook(seed: BookSeed, now: string): Book {
  const titles = BOOK_CHAPTERS[seed.id];
  return {
    id: seed.id,
    title: seed.title,
    author: seed.author,
    coverUrl: seed.cover,
    totalChapters: seed.chapters,
    currentChapter: 0,
    ...(titles ? { chapterTitles: titles } : {}),
    status: "want",
    pillarId: seed.pillarId,
    startedAt: null,
    finishedAt: null,
    rating: null,
    entries: [],
    createdAt: now,
  };
}

function seedPillar(seed: PillarSeed, now: string): PillarState {
  return {
    id: seed.id,
    bookId: `book-${seed.id}`,
    rungs: seedRungs(seed, now),
    resources: seed.resources.map((r) => ({ id: uid(), ...r })),
    notes: "",
  };
}

function seedChecklist(list: ChecklistId, source: Record<string, string[]>): ChecklistItem[] {
  return Object.entries(source).flatMap(([group, labels]) =>
    labels.map((label) => ({ id: uid(), list, group, label, doneAt: null })),
  );
}

export function createInitialData(): AppData {
  const now = new Date().toISOString();
  return {
    pillars: Object.fromEntries(PILLARS.map((p) => [p.id, seedPillar(p, now)])) as Record<PillarId, PillarState>,
    books: BOOK_SEEDS.map((b) => seedBook(b, now)),
    checklist: [...seedChecklist("dsa", DSA_CHECKLIST), ...seedChecklist("system-design", SYSTEM_DESIGN_CHECKLIST)],
    customProblems: [],
    attempts: [],
    learntTopics: [...DEFAULT_LEARNT_TOPICS],
    stories: [],
    schedule: [],
    scheduleDone: {},
  };
}

export function pickData(state: AppState): AppData {
  const { pillars, books, checklist, customProblems, attempts, learntTopics, stories, schedule, scheduleDone } = state;
  return { pillars, books, checklist, customProblems, attempts, learntTopics, stories, schedule, scheduleDone };
}

type LegacyBook = Book & { totalPages?: number | null; currentPage?: number };
type LegacyEntry = ReadingEntry & { page?: number | null };

type LegacyRung = Omit<Rung, "chapters" | "chaptersDone" | "unit" | "chapterTitles"> & Partial<Rung>;
type LegacyPillar = Omit<PillarState, "rungs"> & {
  rungs?: LegacyRung[];
  status?: "not-started" | "in-progress" | "done";
};
type LegacyChecklistItem = Omit<ChecklistItem, "list"> & { list?: ChecklistId };
type LegacyData = Omit<AppData, "stories" | "schedule" | "scheduleDone"> & Partial<AppData>;

/**
 * v1 tracked progress in pages; v2 tracks chapters. Seeded books get their
 * chapter count and an estimated chapter from the page ratio. Other books
 * keep their sessions but need a chapter count entered by hand.
 */
function migrateBooks(books: Book[]): Book[] {
  const seedChapters = new Map(BOOK_SEEDS.map((b) => [b.id, b.chapters]));
  return books.map((raw) => {
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
}

/**
 * v4 split each roadmap step into chapters. Steps that match a seeded one
 * (by its current or an earlier label) pick up its parts and linked book.
 */
function upgradeRung(pillarId: PillarId, r: LegacyRung): Rung {
  if (r.chapters !== undefined) return r as Rung;
  const base: Rung = { ...r, chapters: null, chaptersDone: 0, unit: "chapter", chapterTitles: [] };
  const seed = PILLAR_BY_ID[pillarId].rungs.find((x) => x.label === r.label || x.was?.includes(r.label));
  if (!seed) return base;
  const parts = partsFromSeed(seed);
  return {
    ...base,
    ...parts,
    label: seed.label,
    url: r.url || seed.url || "",
    bookId: r.bookId ?? seedBookId(pillarId, seed),
    chaptersDone: r.doneAt && parts.chapters ? parts.chapters : 0,
  };
}

/**
 * v3 replaced the roadmap’s manual pillar status with a list of steps per
 * pillar, and added the interview pillar, stories and the schedule.
 * A pillar marked done keeps that by having every step ticked.
 */
export function migrateData(input: LegacyData): AppData {
  const now = new Date().toISOString();
  const hadInterview = "interview" in input.pillars;

  const pillars = Object.fromEntries(
    PILLARS.map((seed) => {
      const raw = (input.pillars as Partial<Record<PillarId, LegacyPillar>>)[seed.id];
      if (!raw) return [seed.id, seedPillar(seed, now)];
      const { status, rungs, ...rest } = raw;
      if (rungs) return [seed.id, { ...rest, rungs: rungs.map((r) => upgradeRung(seed.id, r)) }];
      const seeded = seedRungs(seed, now).map((r) =>
        status === "done" ? { ...r, doneAt: now, chaptersDone: r.chapters ?? 0 } : r,
      );
      return [seed.id, { ...rest, rungs: seeded }];
    }),
  ) as Record<PillarId, PillarState>;

  // Add seeded books that pillars or their steps now point at, and chapter titles to seeded books.
  const referenced = new Set(
    Object.values(pillars).flatMap((p) => [p.bookId, ...p.rungs.map((r) => r.bookId)]).filter((id): id is string => !!id),
  );
  let books = migrateBooks(input.books).map((b) =>
    b.chapterTitles === undefined && BOOK_CHAPTERS[b.id] ? { ...b, chapterTitles: BOOK_CHAPTERS[b.id] } : b,
  );
  for (const seed of BOOK_SEEDS) {
    if (referenced.has(seed.id) && !books.some((b) => b.id === seed.id)) books = [...books, seedBook(seed, now)];
  }

  let checklist = (input.checklist as LegacyChecklistItem[]).map((c) => ({ ...c, list: c.list ?? "dsa" }));
  if (!hadInterview) checklist = [...checklist, ...seedChecklist("system-design", SYSTEM_DESIGN_CHECKLIST)];

  return {
    ...input,
    books,
    pillars,
    checklist,
    stories: input.stories ?? [],
    schedule: input.schedule ?? [],
    scheduleDone: input.scheduleDone ?? {},
  };
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

function patchRung(state: AppState, id: PillarId, rungId: string, fn: (r: Rung) => Rung) {
  return patchPillar(state, id, (p) => ({ ...p, rungs: p.rungs.map((r) => (r.id === rungId ? fn(r) : r)) }));
}

/** Swap with the nearest neighbour in that direction that `sameGroup` accepts. */
function moveItem<T extends { id: string }>(
  items: T[],
  id: string,
  delta: -1 | 1,
  sameGroup: (a: T, b: T) => boolean = () => true,
): T[] {
  const i = items.findIndex((x) => x.id === id);
  if (i < 0) return items;
  let j = i + delta;
  while (j >= 0 && j < items.length && !sameGroup(items[i]!, items[j]!)) j += delta;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

function mapPillars(pillars: Record<PillarId, PillarState>, fn: (p: PillarState) => PillarState) {
  return Object.fromEntries(Object.entries(pillars).map(([pid, p]) => [pid, fn(p)])) as Record<PillarId, PillarState>;
}

/** Finishing a book ticks off any rung linked to it. */
function withBookSync(state: AppState, books: Book[]): Pick<AppData, "books" | "pillars"> {
  const finished = new Set(
    books
      .filter((b) => b.status === "finished" && state.books.find((x) => x.id === b.id)?.status !== "finished")
      .map((b) => b.id),
  );
  if (finished.size === 0) return { books, pillars: state.pillars };
  const now = new Date().toISOString();
  const pillars = mapPillars(state.pillars, (p) =>
    p.rungs.some((r) => !r.doneAt && r.bookId && finished.has(r.bookId))
      ? { ...p, rungs: p.rungs.map((r) => (!r.doneAt && r.bookId && finished.has(r.bookId) ? { ...r, doneAt: now } : r)) }
      : p,
  );
  return { books, pillars };
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

function partsTotal(state: AppState, rung: Rung): number | null {
  if (rung.bookId) return state.books.find((b) => b.id === rung.bookId)?.totalChapters ?? null;
  return rung.chapters;
}

function progressPatch(state: AppState, id: PillarId, rungId: string, done: number): Partial<AppData> {
  const rung = state.pillars[id].rungs.find((r) => r.id === rungId);
  const total = rung ? partsTotal(state, rung) : null;
  if (!rung || !total) return {};
  const n = clamp(Math.round(done), 0, total);
  const complete = n === total;
  const now = new Date().toISOString();
  const today = todayISO();
  const book = rung.bookId ? state.books.find((b) => b.id === rung.bookId) : undefined;

  const books = book
    ? state.books.map((b) =>
        b.id !== book.id
          ? b
          : {
              ...b,
              currentChapter: n,
              status: complete
                ? ("finished" as const)
                : b.status === "finished" || (b.status === "want" && n > 0)
                  ? ("reading" as const)
                  : b.status,
              startedAt: b.startedAt ?? (n > 0 ? today : null),
              finishedAt: complete ? (b.finishedAt ?? today) : null,
            },
      )
    : state.books;

  // Every step reading the same book moves with it.
  const affects = (r: Rung) => r.id === rungId || (book != null && r.bookId === book.id);
  const pillars = mapPillars(state.pillars, (p) =>
    p.rungs.some(affects)
      ? {
          ...p,
          rungs: p.rungs.map((r) =>
            affects(r)
              ? {
                  ...r,
                  chaptersDone: book ? r.chaptersDone : n,
                  startedAt: r.startedAt ?? (n > 0 ? now : null),
                  doneAt: complete ? (r.doneAt ?? now) : null,
                }
              : r,
          ),
        }
      : p,
  );
  return { books, pillars };
}

function startedPatch(state: AppState, id: PillarId, rungId: string, started: boolean): Partial<AppData> {
  const rung = state.pillars[id].rungs.find((r) => r.id === rungId);
  if (!rung) return {};
  const book = rung.bookId ? state.books.find((b) => b.id === rung.bookId) : undefined;
  const books = !book
    ? state.books
    : state.books.map((b) => {
        if (b.id !== book.id) return b;
        if (started && b.status === "want") return { ...b, status: "reading" as const, startedAt: b.startedAt ?? todayISO() };
        if (!started && b.status === "reading" && b.currentChapter === 0 && b.entries.length === 0) {
          return { ...b, status: "want" as const, startedAt: null };
        }
        return b;
      });
  const pillars = patchRung(state, id, rungId, (r) => ({
    ...r,
    startedAt: started ? (r.startedAt ?? new Date().toISOString()) : null,
  })).pillars;
  return { books, pillars };
}

/** Only the last few months of schedule ticks are worth keeping. */
function pruneDone(done: Record<string, string[]>, keepDays = 90): Record<string, string[]> {
  const cutoff = todayISO(new Date(Date.now() - keepDays * 86_400_000));
  return Object.fromEntries(Object.entries(done).filter(([date, ids]) => date >= cutoff && ids.length > 0));
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createInitialData(),

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
        set((s) => patchPillar(s, id, (p) => ({ ...p, resources: moveItem(p.resources, resourceId, delta) }))),

      addRung: (id, rung) =>
        set((s) =>
          patchPillar(s, id, (p) => ({
            ...p,
            rungs: [
              ...p.rungs,
              {
                url: "",
                track: "",
                bookId: null,
                related: [],
                chapters: null,
                unit: "chapter",
                chapterTitles: [],
                ...rung,
                chaptersDone: 0,
                id: uid(),
                startedAt: null,
                doneAt: null,
              },
            ],
          })),
        ),
      updateRung: (id, rungId, patch) =>
        set((s) =>
          patchRung(s, id, rungId, (r) => {
            const next = { ...r, ...patch };
            if (next.chapters != null) next.chaptersDone = Math.min(next.chaptersDone, next.chapters);
            return next;
          }),
        ),
      removeRung: (id, rungId) =>
        set((s) => patchPillar(s, id, (p) => ({ ...p, rungs: p.rungs.filter((r) => r.id !== rungId) }))),
      moveRung: (id, rungId, delta) =>
        set((s) => patchPillar(s, id, (p) => ({ ...p, rungs: moveItem(p.rungs, rungId, delta, (a, b) => a.track === b.track) }))),
      toggleRungDone: (id, rungId) =>
        set((s) => {
          const rung = s.pillars[id].rungs.find((r) => r.id === rungId);
          if (!rung) return {};
          // A step with parts is complete exactly when all its parts are.
          const total = partsTotal(s, rung);
          if (total) return progressPatch(s, id, rungId, rung.doneAt ? total - 1 : total);
          const now = new Date().toISOString();
          return patchRung(s, id, rungId, (r) =>
            r.doneAt ? { ...r, doneAt: null } : { ...r, doneAt: now, startedAt: r.startedAt ?? now },
          );
        }),
      setRungProgress: (id, rungId, done) => set((s) => progressPatch(s, id, rungId, done)),
      toggleRungStarted: (id, rungId) =>
        set((s) => {
          const rung = s.pillars[id].rungs.find((r) => r.id === rungId);
          return rung ? startedPatch(s, id, rungId, !rung.startedAt) : {};
        }),
      setRungStarted: (id, rungId, started) => set((s) => startedPatch(s, id, rungId, started)),

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
        set((s) =>
          withBookSync(
            s,
            s.books.map((b) => {
              if (b.id !== id) return b;
              const next = { ...b, ...patch };
              if (patch.status === "reading" && !next.startedAt) next.startedAt = todayISO();
              if (patch.status === "finished") {
                next.finishedAt = next.finishedAt ?? todayISO();
                if (next.totalChapters) next.currentChapter = next.totalChapters;
              }
              return next;
            }),
          ),
        ),
      removeBook: (id) =>
        set((s) => ({
          books: s.books.filter((b) => b.id !== id),
          pillars: mapPillars(s.pillars, (p) => ({
            ...p,
            bookId: p.bookId === id ? null : p.bookId,
            rungs: p.rungs.some((r) => r.bookId === id)
              ? p.rungs.map((r) => (r.bookId === id ? { ...r, bookId: null } : r))
              : p.rungs,
          })),
        })),
      logReading: (bookId, entry) =>
        set((s) =>
          withBookSync(
            s,
            s.books.map((b) => (b.id === bookId ? applyReading(b, { ...entry, id: uid() }) : b)),
          ),
        ),
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
      addChecklistItem: (list, group, label) =>
        set((s) => {
          const item = { id: uid(), list, group, label, doneAt: null };
          let lastIdx = -1;
          s.checklist.forEach((c, i) => {
            if (c.list === list && c.group === group) lastIdx = i;
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

      addStory: (title, themes) =>
        set((s) => ({
          stories: [
            ...s.stories,
            { id: uid(), title, themes, notes: "", practisedAt: null, createdAt: new Date().toISOString() },
          ],
        })),
      updateStory: (id, patch) =>
        set((s) => ({ stories: s.stories.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),
      removeStory: (id) => set((s) => ({ stories: s.stories.filter((st) => st.id !== id) })),

      addBlock: (block) => set((s) => ({ schedule: [...s.schedule, { ...block, id: uid() }] })),
      updateBlock: (id, patch) =>
        set((s) => ({ schedule: s.schedule.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeBlock: (id) => set((s) => ({ schedule: s.schedule.filter((b) => b.id !== id) })),
      toggleBlockDone: (date, blockId) =>
        set((s) => {
          const ids = s.scheduleDone[date] ?? [];
          const next = ids.includes(blockId) ? ids.filter((x) => x !== blockId) : [...ids, blockId];
          return { scheduleDone: pruneDone({ ...s.scheduleDone, [date]: next }) };
        }),
      loadSampleSchedule: () =>
        set((s) => ({ schedule: [...s.schedule, ...SAMPLE_SCHEDULE.map((b) => ({ ...b, id: uid() }))] })),

      importData: (data) => set(() => ({ ...createInitialData(), ...migrateData(data) })),
      resetAll: () => set(() => createInitialData()),
    }),
    {
      name: "cs-tracker",
      version: 4,
      partialize: (s) => pickData(s),
      migrate: (persisted) => migrateData(persisted as LegacyData),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<AppData>;
        // Keep any pillars added in newer versions of the app.
        return { ...current, ...p, pillars: { ...current.pillars, ...(p.pillars ?? {}) } };
      },
    },
  ),
);
