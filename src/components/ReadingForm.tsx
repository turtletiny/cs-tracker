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
  const [page, setPage] = useState(book.currentPage ? String(book.currentPage) : "");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const pageNum = page.trim() === "" ? null : Number(page);
  const pageInvalid = pageNum != null && (!Number.isFinite(pageNum) || pageNum < 0);

  return (
    <form
      className="reading-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (pageInvalid) return;
        const mins = minutes.trim() === "" ? null : Math.max(0, Math.round(Number(minutes)));
        logReading(book.id, {
          date,
          page: pageNum == null ? null : Math.round(pageNum),
          minutes: Number.isFinite(mins) ? mins : null,
          note: note.trim(),
        });
        toast(pageNum != null ? `Logged — now on page ${Math.round(pageNum)}` : "Session logged");
        setNote("");
        setMinutes("");
        onDone?.();
      }}
    >
      {compact && <span className="eyebrow">Log a session</span>}
      <div className="form-grid">
        <label className="field" htmlFor={`${id}-page`}>
          Reached page{book.totalPages ? ` (of ${book.totalPages})` : ""}
          <input
            id={`${id}-page`}
            className="input num"
            type="number"
            min={0}
            max={book.totalPages ?? undefined}
            inputMode="numeric"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            aria-invalid={pageInvalid}
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
        <button className="btn btn--primary btn--sm" type="submit" disabled={pageInvalid}>
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
