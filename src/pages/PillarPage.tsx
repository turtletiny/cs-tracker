import { useState } from "react";
import { Link, useParams } from "react-router";
import { Cover } from "../components/Cover";
import { CoverEditor } from "../components/CoverEditor";
import { ProgressBar } from "../components/ProgressBar";
import { ReadingForm } from "../components/ReadingForm";
import { Segmented } from "../components/Segmented";
import { useToast } from "../components/Toast";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import { bookProgress, checklistProgress, pageLabel, PILLAR_STATUS } from "../lib/selectors";
import { isSafeUrl, normalizeUrl } from "../lib/util";
import { useStore } from "../store";
import type { PillarId, Resource } from "../types";
import { NotFound } from "./NotFound";

export function PillarPage() {
  const { id } = useParams();
  const seed = id ? PILLAR_BY_ID[id as PillarId] : undefined;
  if (!seed) return <NotFound />;
  return <PillarView key={seed.id} id={seed.id} />;
}

function PillarView({ id }: { id: PillarId }) {
  const seed = PILLAR_BY_ID[id];
  const index = PILLARS.findIndex((p) => p.id === id);
  const prev = PILLARS[index - 1];
  const next = PILLARS[index + 1];

  const pillar = useStore((s) => s.pillars[id]);
  const setStatus = useStore((s) => s.setPillarStatus);
  const setNotes = useStore((s) => s.setPillarNotes);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">← Roadmap</Link>
        <span aria-hidden="true">/</span>
        <span>
          Pillar {index + 1} of {PILLARS.length}
        </span>
      </nav>

      <div className="pillar">
        <PillarBook pillarId={id} />

        <div className="pillar__main">
          <header className="pillar__head">
            <span className="pillar__num" aria-hidden="true">
              no. {index + 1}
            </span>
            <h1>{seed.title}</h1>
            <p className="pillar__why">{seed.why}</p>
            <div className="row" style={{ marginTop: "var(--space-xs)" }}>
              <Segmented
                label="Status"
                value={pillar.status}
                options={PILLAR_STATUS}
                onChange={(s) => setStatus(id, s)}
              />
            </div>
          </header>

          <Resources pillarId={id} />

          {id === "algorithms" && <Checklist />}

          <section aria-labelledby="notes-h">
            <div className="section-head">
              <h2 id="notes-h">Notes</h2>
              <span className="small muted">Saved as you type</span>
            </div>
            <label htmlFor="pillar-notes" className="visually-hidden">
              Notes for {seed.title}
            </label>
            <textarea
              id="pillar-notes"
              className="ruled"
              value={pillar.notes}
              placeholder="Chapters to revisit, exercises done, questions…"
              onChange={(e) => setNotes(id, e.target.value)}
            />
          </section>

          <nav className="pillar-nav" aria-label="Pillars">
            {prev && (
              <Link to={`/pillar/${prev.id}`}>
                <span className="small muted">← Previous</span>
                <strong>{prev.short}</strong>
              </Link>
            )}
            {next && (
              <Link to={`/pillar/${next.id}`}>
                <span className="small muted">Next →</span>
                <strong>{next.short}</strong>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

function PillarBook({ pillarId }: { pillarId: PillarId }) {
  const pillar = useStore((s) => s.pillars[pillarId]);
  const book = useStore((s) => s.books.find((b) => b.id === pillar.bookId));
  const books = useStore((s) => s.books);
  const updateBook = useStore((s) => s.updateBook);
  const setPillarBook = useStore((s) => s.setPillarBook);
  const [mode, setMode] = useState<"view" | "cover" | "log" | "swap">("view");

  if (!book) {
    return (
      <aside className="pillar__side">
        <div className="empty">
          <strong>No book linked</strong>
          <p className="small">Pick one from your book log to track it here.</p>
          <BookPicker
            books={books}
            value=""
            onChange={(bookId) => setPillarBook(pillarId, bookId || null)}
          />
        </div>
      </aside>
    );
  }

  const progress = bookProgress(book);

  return (
    <aside className="pillar__side">
      <Cover src={book.coverUrl} title={book.title} author={book.author} />

      <div className="book-meta">
        <span className="eyebrow">The book</span>
        <Link to={`/books/${book.id}`} className="book-meta__title" style={{ textDecoration: "none" }}>
          {book.title}
        </Link>
        <span className="book-meta__author">{book.author}</span>
        <span className="small num" style={{ marginTop: "0.35rem" }}>
          {pageLabel(book)}
        </span>
        {progress != null && <ProgressBar value={progress} label="Reading progress" />}
      </div>

      {mode === "cover" && (
        <CoverEditor
          value={book.coverUrl}
          onSave={(url) => {
            updateBook(book.id, { coverUrl: url });
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}
      {mode === "log" && <ReadingForm book={book} compact onDone={() => setMode("view")} />}
      {mode === "swap" && (
        <div className="cover-editor">
          <BookPicker
            books={books}
            value={book.id}
            onChange={(bookId) => {
              setPillarBook(pillarId, bookId || null);
              setMode("view");
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode("view")}>
            Cancel
          </button>
        </div>
      )}

      {mode === "view" && (
        <div className="row">
          {book.status !== "finished" && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setMode("log")}>
              Log reading
            </button>
          )}
          <button type="button" className="btn btn--sm" onClick={() => setMode("cover")}>
            Change cover
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode("swap")}>
            Swap book
          </button>
        </div>
      )}
    </aside>
  );
}

function BookPicker({
  books,
  value,
  onChange,
}: {
  books: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="field">
      Linked book
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— None —</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Resources({ pillarId }: { pillarId: PillarId }) {
  const resources = useStore((s) => s.pillars[pillarId].resources);
  const addResource = useStore((s) => s.addResource);
  const [adding, setAdding] = useState(false);

  return (
    <section aria-labelledby="res-h">
      <div className="section-head">
        <h2 id="res-h">Resources</h2>
        {!adding && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAdding(true)}>
            + Add link
          </button>
        )}
      </div>
      {resources.length === 0 && !adding && (
        <p className="small muted" style={{ paddingBlock: "var(--space-s)" }}>
          No links yet — add lecture series, problem sets or anything else worth coming back to.
        </p>
      )}
      <ol className="resources">
        {resources.map((r, i) => (
          <ResourceRow key={r.id} pillarId={pillarId} resource={r} first={i === 0} last={i === resources.length - 1} />
        ))}
      </ol>
      {adding && (
        <ResourceForm
          submitLabel="Add"
          onSubmit={(label, url) => {
            addResource(pillarId, label, url);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  );
}

function ResourceRow({
  pillarId,
  resource,
  first,
  last,
}: {
  pillarId: PillarId;
  resource: Resource;
  first: boolean;
  last: boolean;
}) {
  const update = useStore((s) => s.updateResource);
  const remove = useStore((s) => s.removeResource);
  const add = useStore((s) => s.addResource);
  const move = useStore((s) => s.moveResource);
  const toast = useToast((s) => s.show);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li style={{ listStyle: "none" }}>
        <ResourceForm
          initialLabel={resource.label}
          initialUrl={resource.url}
          submitLabel="Save"
          onSubmit={(label, url) => {
            update(pillarId, resource.id, { label, url });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const safe = isSafeUrl(resource.url);

  return (
    <li className="resource">
      <span className="resource__label">
        {safe ? (
          <a className="link" href={resource.url} target="_blank" rel="noreferrer">
            {resource.label}
          </a>
        ) : (
          resource.label
        )}
        <span className="resource__host">{hostOf(resource.url)}</span>
      </span>
      <span className="resource__tools">
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${resource.label} up`}
          disabled={first}
          onClick={() => move(pillarId, resource.id, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${resource.label} down`}
          disabled={last}
          onClick={() => move(pillarId, resource.id, 1)}
        >
          ↓
        </button>
        <button type="button" className="icon-btn" aria-label={`Edit ${resource.label}`} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${resource.label}`}
          onClick={() => {
            remove(pillarId, resource.id);
            toast(`Removed “${resource.label}”`, {
              label: "Undo",
              run: () => add(pillarId, resource.label, resource.url),
            });
          }}
        >
          ✕
        </button>
      </span>
    </li>
  );
}

function ResourceForm({
  initialLabel = "",
  initialUrl = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialLabel?: string;
  initialUrl?: string;
  submitLabel: string;
  onSubmit: (label: string, url: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [url, setUrl] = useState(initialUrl);
  const normalized = normalizeUrl(url);
  const valid = normalized !== "" && isSafeUrl(normalized);

  return (
    <form
      className="resource-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit(label.trim() || hostOf(normalized), normalized);
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <label className="field">
        Label
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Lecture 4 notes" autoFocus />
      </label>
      <label className="field">
        URL
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
      </label>
      <div className="form-actions">
        <button className="btn btn--primary btn--sm" type="submit" disabled={!valid}>
          {submitLabel}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Checklist() {
  const checklist = useStore((s) => s.checklist);
  const toggle = useStore((s) => s.toggleChecklistItem);
  const add = useStore((s) => s.addChecklistItem);
  const remove = useStore((s) => s.removeChecklistItem);
  const toast = useToast((s) => s.show);
  const groups = [...new Set(checklist.map((c) => c.group))];
  const done = checklist.filter((c) => c.doneAt).length;

  return (
    <section aria-labelledby="checklist" className="checklist">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h2 id="checklist">Implement from scratch</h2>
        <span className="small muted num">
          {done} of {checklist.length} · {Math.round(checklistProgress(checklist) * 100)}%
        </span>
      </div>
      <div className="checklist__groups">
        {groups.map((group) => {
          const items = checklist.filter((c) => c.group === group);
          return (
            <div key={group} className="checklist__group">
              <h3>
                {group}
                <span className="small muted num" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>
                  {items.filter((i) => i.doneAt).length}/{items.length}
                </span>
              </h3>
              {items.map((item) => (
                <div key={item.id} className="check">
                  <label>
                    <input type="checkbox" checked={!!item.doneAt} onChange={() => toggle(item.id)} />
                    <span className="check__label">{item.label}</span>
                  </label>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => {
                      remove(item.id);
                      toast(`Removed “${item.label}”`, { label: "Undo", run: () => add(group, item.label) });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <AddItem onAdd={(label) => add(group, label)} group={group} />
            </div>
          );
        })}
      </div>
      <p className="small muted">
        Practising problems instead?{" "}
        <Link className="link" to="/leetcode">
          Go to the LeetCode tracker →
        </Link>
      </p>
    </section>
  );
}

function AddItem({ onAdd, group }: { onAdd: (label: string) => void; group: string }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="inline-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
    >
      <label className="visually-hidden" htmlFor={`add-${group}`}>
        Add to {group}
      </label>
      <input
        id={`add-${group}`}
        className="input"
        placeholder="Add an item…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn btn--sm" disabled={!value.trim()}>
        Add
      </button>
    </form>
  );
}
