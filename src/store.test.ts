import { describe, expect, it } from "vitest";
import { createInitialData, migrateData, type AppData } from "./store";

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
    expect(migrateData(data).books).toEqual(data.books);
  });
});
