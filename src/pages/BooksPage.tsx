import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Cover } from "../components/Cover";
import { CoverEditor } from "../components/CoverEditor";
import { ProgressBar } from "../components/ProgressBar";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import { BOOK_STATUS, bookProgress, pageLabel } from "../lib/selectors";
import { formatDate } from "../lib/util";
import { useStore } from "../store";
import type { Book, BookStatus, PillarId } from "../types";

export function BooksPage() {
  const books = useStore((s) => s.books);
  const [adding, setAdding] = useState(false);

  const by = (status: BookStatus) => books.filter((b) => b.status === status);
  const reading = by("reading");
  const want = by("want");
  const finished = by("finished").sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
  const abandoned = by("abandoned");

  const sessions = books.reduce((n, b) => n + b.entries.length, 0);
  const minutes = books.reduce((n, b) => n + b.entries.reduce((m, e) => m + (e.minutes ?? 0), 0), 0);

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Reading</span>
        <div className="page-head__row">
          <h1>Book log</h1>
          {!adding && (
            <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
              + Add a book
            </button>
          )}
        </div>
        <p className="lede">
          {sessions === 0
            ? "Log each sitting with the page you reached — progress, shelves and the roadmap update from there."
            : `${reading.length ? `${reading.length} on the go` : "Nothing on the go"}, ${finished.length} finished. ${sessions} session${sessions === 1 ? "" : "s"} logged${minutes ? `, ${formatMinutes(minutes)} in total` : ""}.`}
        </p>
      </header>

      {adding && <AddBook onClose={() => setAdding(false)} />}

      {reading.length > 0 && (
        <section className="shelf shelf--featured" aria-labelledby="shelf-reading">
          <div className="section-head">
            <h2 id="shelf-reading">Reading now</h2>
          </div>
          <div className="shelf__books">
            {reading.map((b, i) => (
              <WideBook key={b.id} book={b} index={i} />
            ))}
          </div>
        </section>
      )}

      <Shelf id="want" title="Up next" books={want} empty="Nothing queued. Add a book to plan what comes after the current one." />
      <Shelf id="finished" title="Finished" books={finished} empty="Finished books land here with the date you closed them." />
      {abandoned.length > 0 && <Shelf id="abandoned" title="Set aside" books={abandoned} />}
    </>
  );
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

function WideBook({ book, index }: { book: Book; index: number }) {
  const progress = bookProgress(book);
  const last = book.entries[0];
  return (
    <Link to={`/books/${book.id}`} className="book-wide" style={{ "--i": index } as React.CSSProperties}>
      <Cover src={book.coverUrl} title={book.title} author={book.author} />
      <span className="book-wide__body">
        {book.pillarId && <span className="tag">{PILLAR_BY_ID[book.pillarId].short}</span>}
        <span className="book-wide__title">{book.title}</span>
        <span className="small muted">{book.author}</span>
        <span className="small num" style={{ marginTop: "0.4rem" }}>
          {pageLabel(book)}
          {progress != null && <span className="muted"> · {Math.round(progress * 100)}%</span>}
        </span>
        {progress != null && <ProgressBar value={progress} label={`${book.title} progress`} />}
        {last && <span className="small muted">Last session {formatDate(last.date)}</span>}
      </span>
    </Link>
  );
}

function Shelf({ id, title, books, empty }: { id: string; title: string; books: Book[]; empty?: string }) {
  return (
    <section className="shelf" aria-labelledby={`shelf-${id}`}>
      <div className="section-head">
        <h2 id={`shelf-${id}`}>{title}</h2>
        <span className="small muted num">{books.length}</span>
      </div>
      {books.length === 0 ? (
        empty && <p className="small muted">{empty}</p>
      ) : (
        <div className="shelf__books">
          {books.map((b, i) => (
            <Link key={b.id} to={`/books/${b.id}`} className="book-tile" style={{ "--i": i } as React.CSSProperties}>
              <Cover src={b.coverUrl} title={b.title} author={b.author} />
              <span className="stack-s" style={{ gap: "0.15rem" }}>
                <span className="book-tile__title">{b.title}</span>
                <span className="book-tile__author">{b.author}</span>
                {b.status === "finished" && b.finishedAt && (
                  <span className="book-tile__author">
                    {b.rating ? `${"★".repeat(b.rating)} · ` : ""}
                    {formatDate(b.finishedAt)}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function AddBook({ onClose }: { onClose: () => void }) {
  const addBook = useStore((s) => s.addBook);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [pillarId, setPillarId] = useState<PillarId | "">("");
  const [status, setStatus] = useState<BookStatus>("want");
  const [coverUrl, setCoverUrl] = useState("");
  const [editingCover, setEditingCover] = useState(false);

  const pagesNum = pages.trim() === "" ? null : Math.round(Number(pages));
  const pagesInvalid = pagesNum != null && (!Number.isFinite(pagesNum) || pagesNum <= 0);

  return (
    <form
      className="add-book"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || pagesInvalid) return;
        const id = addBook({
          title: title.trim(),
          author: author.trim(),
          totalPages: pagesNum,
          pillarId: pillarId || null,
          status,
          coverUrl,
          startedAt: status === "reading" ? new Date().toISOString().slice(0, 10) : null,
        });
        navigate(`/books/${id}`);
      }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <h2>New book</h2>
      <div className="row" style={{ alignItems: "start", gap: "var(--space-m)" }}>
        <div style={{ width: "7rem", flex: "none" }} className="stack-s">
          <Cover src={coverUrl} title={title || "Untitled"} author={author} />
          {!editingCover && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingCover(true)}>
              {coverUrl ? "Change cover" : "Add cover"}
            </button>
          )}
        </div>
        <div className="stack" style={{ flex: "1 1 20rem", minWidth: 0 }}>
          {editingCover && (
            <CoverEditor
              value={coverUrl}
              onSave={(url) => {
                setCoverUrl(url);
                setEditingCover(false);
              }}
              onCancel={() => setEditingCover(false)}
            />
          )}
          <div className="form-grid">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Title
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              Author
              <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </label>
            <label className="field">
              Pages
              <input
                className="input num"
                type="number"
                min={1}
                inputMode="numeric"
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
              Shelf
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as BookStatus)}>
                {BOOK_STATUS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={!title.trim() || pagesInvalid}>
              Add to log
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
