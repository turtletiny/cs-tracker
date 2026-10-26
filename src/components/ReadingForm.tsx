import { useId, useState } from "react";
import { todayISO } from "../lib/util";
import { useStore } from "../store";
import type { Book } from "../types";
import { useToast } from "./Toast";

interface Props {
  book: Book;
  onDone?: () => void;
  compact?: boolean;
}

export function ReadingForm({ book, onDone, compact = false }: Props) {
  const logReading = useStore((s) => s.logReading);
  const toast = useToast((s) => s.show);
  const id = useId();
  const [date, setDate] = useState(todayISO());
  const [chapter, setChapter] = useState(String(Math.min(book.currentChapter + 1, book.totalChapters ?? Infinity)));
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const chapterNum = chapter.trim() === "" ? null : Number(chapter);
  const chapterInvalid =
    chapterNum != null &&
    (!Number.isFinite(chapterNum) || chapterNum < 0 || (book.totalChapters != null && chapterNum > book.totalChapters));

  return (
    <form
      className="reading-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (chapterInvalid) return;
        const mins = minutes.trim() === "" ? null : Math.max(0, Math.round(Number(minutes)));
        logReading(book.id, {
          date,
          chapter: chapterNum == null ? null : Math.round(chapterNum),
          minutes: Number.isFinite(mins) ? mins : null,
          note: note.trim(),
        });
        toast(chapterNum != null ? `Logged — ${Math.round(chapterNum)} chapter${Math.round(chapterNum) === 1 ? "" : "s"} done` : "Session logged");
        setNote("");
        setMinutes("");
        onDone?.();
      }}
    >
      {compact && <span className="eyebrow">Log a session</span>}
      <div className="form-grid">
        <label className="field" htmlFor={`${id}-chapter`}>
          Chapters done{book.totalChapters ? ` (of ${book.totalChapters})` : ""}
          <input
            id={`${id}-chapter`}
            className="input num"
            type="number"
            min={0}
            max={book.totalChapters ?? undefined}
            inputMode="numeric"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            aria-invalid={chapterInvalid}
            autoFocus={compact}
          />
        </label>
        <label className="field" htmlFor={`${id}-min`}>
          Minutes
          <input
            id={`${id}-min`}
            className="input num"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="optional"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="field" htmlFor={`${id}-date`}>
          Date
          <input
            id={`${id}-date`}
            className="input"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value || todayISO())}
          />
        </label>
      </div>
      <label className="field" htmlFor={`${id}-note`}>
        Note
        <input
          id={`${id}-note`}
          className="input"
          type="text"
          placeholder="What clicked, what didn’t…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button className="btn btn--primary btn--sm" type="submit" disabled={chapterInvalid}>
          Log session
        </button>
        {onDone && (
          <button className="btn btn--ghost btn--sm" type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
