import { beforeEach, describe, expect, it } from "vitest";
import { createInitialData, migrateData, useStore, type AppData } from "./store";

describe("migrateData (pages → chapters)", () => {
  it("converts seeded books proportionally and drops page fields", () => {
    const data = createInitialData();
    const legacy = {
      ...data,
      books: data.books.map((b) => {
        const { totalChapters: _t, currentChapter: _c, ...rest } = b;
        return b.id === "book-os"
          ? { ...rest, totalPages: 714, currentPage: 357, entries: [{ id: "e1", date: "2026-01-01", page: 357, minutes: 30, note: "" }] }
          : { ...rest, totalPages: 100, currentPage: 0 };
      }),
    } as unknown as AppData;

    const os = migrateData(legacy).books.find((b) => b.id === "book-os")!;
    expect(os.totalChapters).toBe(50);
    expect(os.currentChapter).toBe(25);
    expect(os).not.toHaveProperty("totalPages");
    expect(os.entries[0]).toMatchObject({ chapter: null, minutes: 30 });
    expect(os.entries[0]).not.toHaveProperty("page");
  });

  it("leaves already-migrated data alone", () => {
    const data = createInitialData();
    expect(migrateData(data)).toEqual(data);
  });
});

/** Shape of a v2 save: manual pillar status, no interview pillar, no checklist lists. */
function v2Data() {
  const data = createInitialData();
  const { interview: _i, ...pillars } = data.pillars;
  return {
    pillars: Object.fromEntries(
      Object.entries(pillars).map(([id, p]) => {
        const { rungs: _r, ...rest } = p;
        return [id, { ...rest, status: id === "math" ? "done" : "not-started" }];
      }),
    ),
    books: data.books.filter((b) => b.id !== "book-interview"),
    checklist: data.checklist.filter((c) => c.list === "dsa").map(({ list: _l, ...c }) => c),
    customProblems: [],
    attempts: [],
    learntTopics: [],
  } as unknown as AppData;
}

describe("migrateData (roadmap → skills)", () => {
  it("seeds ladders, keeps done pillars done and adds the interview pillar", () => {
    const out = migrateData(v2Data());
    expect(out.pillars.math.rungs.length).toBeGreaterThan(0);
    expect(out.pillars.math.rungs.every((r) => r.doneAt)).toBe(true);
    expect(out.pillars.os.rungs.some((r) => r.doneAt)).toBe(false);
    expect(out.pillars.os).not.toHaveProperty("status");
    expect(out.pillars.interview.rungs.some((r) => r.track === "Behavioural")).toBe(true);
    expect(out.books.some((b) => b.id === "book-interview")).toBe(true);
    expect(out.checklist.some((c) => c.list === "system-design")).toBe(true);
    expect(out.checklist.filter((c) => c.list === "dsa").length).toBeGreaterThan(0);
    expect(out.stories).toEqual([]);
    expect(out.schedule).toEqual([]);
  });

  it("is idempotent", () => {
    const once = migrateData(v2Data());
    expect(migrateData(once)).toEqual(once);
  });
});

describe("book ↔ rung sync", () => {
  beforeEach(() => useStore.getState().resetAll());

  it("ticks rungs linked to a book when the book is finished", () => {
    const { logReading } = useStore.getState();
    const rung = () => useStore.getState().pillars.os.rungs.find((r) => r.bookId === "book-os")!;
    expect(rung().doneAt).toBeNull();
    logReading("book-os", { date: "2026-10-01", chapter: 10, minutes: null, note: "" });
    expect(rung().doneAt).toBeNull();
    logReading("book-os", { date: "2026-10-02", chapter: 50, minutes: null, note: "" });
    expect(rung().doneAt).not.toBeNull();
  });

  it("unlinks rungs when their book is deleted", () => {
    useStore.getState().removeBook("book-os");
    expect(useStore.getState().pillars.os.rungs.some((r) => r.bookId === "book-os")).toBe(false);
  });
});

describe("roadmap progress", () => {
  beforeEach(() => useStore.getState().resetAll());
  const rung = (label: string) => useStore.getState().pillars.programming.rungs.find((r) => r.label === label)!;

  it("tracks parts on a step without a book", () => {
    const { setRungProgress, toggleRungDone } = useStore.getState();
    const id = rung("Boot.dev — Memory Management in C").id;
    setRungProgress("programming", id, 4);
    expect(rung("Boot.dev — Memory Management in C")).toMatchObject({ chaptersDone: 4, doneAt: null });
    toggleRungDone("programming", id);
    expect(rung("Boot.dev — Memory Management in C").chaptersDone).toBe(11);
    expect(rung("Boot.dev — Memory Management in C").doneAt).not.toBeNull();
    toggleRungDone("programming", id);
    expect(rung("Boot.dev — Memory Management in C")).toMatchObject({ chaptersDone: 10, doneAt: null });
  });

  it("moves a linked book along with the step", () => {
    const { setRungProgress } = useStore.getState();
    const book = () => useStore.getState().books.find((b) => b.id === "book-rust")!;
    setRungProgress("programming", rung("The Rust book").id, 3);
    expect(book()).toMatchObject({ currentChapter: 3, status: "reading" });
    setRungProgress("programming", rung("The Rust book").id, 21);
    expect(book().status).toBe("finished");
    expect(rung("The Rust book").doneAt).not.toBeNull();
    setRungProgress("programming", rung("The Rust book").id, 20);
    expect(book()).toMatchObject({ currentChapter: 20, status: "reading", finishedAt: null });
    expect(rung("The Rust book").doneAt).toBeNull();
  });
});

describe("migrateData (steps → chapters)", () => {
  it("matches v3 steps to their seeds by old label and adds books they now need", () => {
    const data = createInitialData();
    const v3 = {
      ...data,
      books: data.books.filter((b) => b.id !== "book-rust" && b.id !== "book-knr"),
      pillars: {
        ...data.pillars,
        programming: {
          ...data.pillars.programming,
          rungs: [
            { id: "a", label: "Finish the Rust book", url: "https://doc.rust-lang.org/book/", track: "", bookId: null, related: [], startedAt: "x", doneAt: null },
            { id: "b", label: "Boot.dev — Learn Memory Management in C", url: "", track: "", bookId: null, related: [], startedAt: null, doneAt: "y" },
            { id: "c", label: "My own thing", url: "", track: "", bookId: null, related: [], startedAt: null, doneAt: null },
          ],
        },
      },
    } as unknown as AppData;

    const out = migrateData(v3);
    const [rust, bootdev, own] = out.pillars.programming.rungs;
    expect(rust).toMatchObject({ id: "a", label: "The Rust book", bookId: "book-rust", startedAt: "x" });
    expect(bootdev).toMatchObject({ chapters: 11, chaptersDone: 11, unit: "chapter" });
    expect(own).toMatchObject({ label: "My own thing", chapters: null, chaptersDone: 0 });
    expect(out.books.find((b) => b.id === "book-rust")?.chapterTitles?.[3]).toBe("Understanding Ownership");
    expect(migrateData(out)).toEqual(out);
  });
});
