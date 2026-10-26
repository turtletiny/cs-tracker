import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmButton } from "../components/ConfirmButton";
import { Cover } from "../components/Cover";
import { CoverEditor } from "../components/CoverEditor";
import { ProgressBar } from "../components/ProgressBar";
import { ReadingForm } from "../components/ReadingForm";
import { useToast } from "../components/Toast";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import { BOOK_STATUS, bookProgress } from "../lib/selectors";
import { formatDate } from "../lib/util";
import { useStore } from "../store";
import type { Book, BookStatus, PillarId } from "../types";
import { NotFound } from "./NotFound";

export function BookPage() {
  const { id } = useParams();
  const book = useStore((s) => s.books.find((b) => b.id === id));
  if (!book) return <NotFound what="book" />;
  return <BookView key={book.id} book={book} />;
}

function BookView({ book }: { book: Book }) {
  const updateBook = useStore((s) => s.updateBook);
  const removeBook = useStore((s) => s.removeBook);
  const removeEntry = useStore((s) => s.removeReadingEntry);
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const [editingCover, setEditingCover] = useState(false);
  const [editing, setEditing] = useState(false);

  const progress = bookProgress(book);
  const totalMinutes = book.entries.reduce((n, e) => n + (e.minutes ?? 0), 0);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/books">← Book log</Link>
        {book.pillarId && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/pillar/${book.pillarId}`}>{PILLAR_BY_ID[book.pillarId].title}</Link>
          </>
        )}
      </nav>

      <div className="book-detail">
        <aside className="pillar__side">
          <Cover src={book.coverUrl} title={book.title} author={book.author} />
          {editingCover ? (
            <CoverEditor
              value={book.coverUrl}
              onSave={(url) => {
                updateBook(book.id, { coverUrl: url });
                setEditingCover(false);
              }}
              onCancel={() => setEditingCover(false)}
            />
          ) : (
            <div className="stack-s">
              <button type="button" className="btn btn--sm" onClick={() => setEditingCover(true)}>
                Change cover
              </button>
              <label className="field">
                Shelf
                <select
                  className="select"
                  value={book.status}
                  onChange={(e) => updateBook(book.id, { status: e.target.value as BookStatus })}
                >
                  {BOOK_STATUS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field">
                Your rating
                <Stars value={book.rating} onChange={(rating) => updateBook(book.id, { rating })} />
              </div>
            </div>
          )}
        </aside>

        <div className="pillar__main">
          {editing ? (
            <EditDetails book={book} onDone={() => setEditing(false)} />
          ) : (
            <header className="pillar__head">
              {book.pillarId && <span className="eyebrow">{PILLAR_BY_ID[book.pillarId].title}</span>}
              <h1 style={{ fontSize: "var(--step-3)" }}>{book.title}</h1>
              {book.author && <p className="pillar__why" style={{ fontStyle: "normal" }}>{book.author}</p>}
              <p className="small muted">
                {[
                  book.totalPages ? `${book.totalPages} pages` : null,
                  book.startedAt ? `started ${formatDate(book.startedAt)}` : null,
                  book.finishedAt && book.status === "finished" ? `finished ${formatDate(book.finishedAt)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No details yet"}
                {"  "}
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
                  Edit details
                </button>
              </p>
            </header>
          )}

          <section aria-labelledby="progress-h" className="stack">
            <div className="section-head">
              <h2 id="progress-h">Progress</h2>
              <span className="small muted num">
                {book.entries.length} session{book.entries.length === 1 ? "" : "s"}
                {totalMinutes > 0 && ` · ${totalMinutes} min`}
              </span>
            </div>
            <p className="big-figure num">
              {book.status === "finished" ? (
                "Finished"
              ) : (
                <>
                  p. {book.currentPage}
                  {book.totalPages ? <small> of {book.totalPages}</small> : null}
                </>
              )}
            </p>
            {progress != null && <ProgressBar value={progress} label="Reading progress" />}
            {!book.totalPages && book.status !== "finished" && (
              <p className="small muted">Add a page count under “Edit details” to see a percentage.</p>
            )}
            {book.status !== "finished" && <ReadingForm key={book.currentPage} book={book} />}
          </section>

          <section aria-labelledby="sessions-h">
            <div className="section-head">
              <h2 id="sessions-h">Sessions</h2>
            </div>
            {book.entries.length === 0 ? (
              <p className="small muted">Each session you log shows up here with its note.</p>
            ) : (
              <ul className="entries">
                {book.entries.map((e) => (
                  <li key={e.id}>
                    <span className="small num">{formatDate(e.date)}</span>
                    <span className="stack-s" style={{ gap: "0.15rem" }}>
                      <span className="small num">
                        {e.page != null ? `to p. ${e.page}` : "—"}
                        {e.minutes ? <span className="muted"> · {e.minutes} min</span> : null}
                      </span>
                      {e.note && <span className="entry__note">{e.note}</span>}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete session from ${formatDate(e.date)}`}
                      onClick={() => {
                        removeEntry(book.id, e.id);
                        toast("Session deleted");
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="row" style={{ paddingTop: "var(--space-m)", borderTop: "1px solid var(--paper-4)" }}>
            <ConfirmButton
              confirmLabel="Delete book and its sessions"
              onConfirm={() => {
                removeBook(book.id);
                toast(`Deleted “${book.title}”`);
                navigate("/books");
              }}
            >
              Delete book
            </ConfirmButton>
          </div>
        </div>
      </div>
    </>
  );
}

function Stars({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="stars" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          data-on={value != null && n <= value}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? null : n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function EditDetails({ book, onDone }: { book: Book; onDone: () => void }) {
  const updateBook = useStore((s) => s.updateBook);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [pages, setPages] = useState(book.totalPages ? String(book.totalPages) : "");
  const [pillarId, setPillarId] = useState<PillarId | "">(book.pillarId ?? "");
  const [startedAt, setStartedAt] = useState(book.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState(book.finishedAt ?? "");

  const pagesNum = pages.trim() === "" ? null : Math.round(Number(pages));
  const pagesInvalid = pagesNum != null && (!Number.isFinite(pagesNum) || pagesNum <= 0);

  return (
    <form
      className="add-book"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || pagesInvalid) return;
        updateBook(book.id, {
          title: title.trim(),
          author: author.trim(),
          totalPages: pagesNum,
          pillarId: pillarId || null,
          startedAt: startedAt || null,
          finishedAt: finishedAt || null,
        });
        onDone();
      }}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
    >
      <div className="form-grid">
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Title
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Author
          <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label className="field">
          Pages
          <input
            className="input num"
            type="number"
            min={1}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            aria-invalid={pagesInvalid}
          />
        </label>
        <label className="field">
          Pillar
          <select className="select" value={pillarId} onChange={(e) => setPillarId(e.target.value as PillarId | "")}>
            <option value="">— None —</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Started
          <input className="input" type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </label>
        <label className="field">
          Finished
          <input className="input" type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={!title.trim() || pagesInvalid}>
          Save details
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
