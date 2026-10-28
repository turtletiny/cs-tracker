import { useState } from "react";
import { Link } from "react-router";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import { progressLabel } from "../lib/selectors";
import { rungParts, rungStatus, summarize, useBookMap } from "../lib/skills";
import { formatDate, isSafeUrl, normalizeUrl } from "../lib/util";
import { useStore, type RungInput } from "../store";
import type { PillarId, Rung } from "../types";
import { Pips } from "./Pips";
import { ProgressBar } from "./ProgressBar";
import { useToast } from "./Toast";

/** Editable list of the resources on a pillar’s roadmap, optionally split into tracks. */
export function Ladder({ pillarId }: { pillarId: PillarId }) {
  const pillar = useStore((s) => s.pillars[pillarId]);
  const bookById = useBookMap();
  const summary = summarize(pillar, bookById);
  // null = closed; otherwise the track the new step goes in ("" for none).
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const addRung = useStore((s) => s.addRung);

  const trackNames = [...new Set(pillar.rungs.map((r) => r.track))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
  const grouped = trackNames.some(Boolean);

  const form = (track: string) => (
    <RungForm
      pillarId={pillarId}
      initial={{ track }}
      submitLabel="Add resource"
      onSubmit={(rung) => {
        addRung(pillarId, rung);
        setAddingTo(null);
      }}
      onCancel={() => setAddingTo(null)}
    />
  );

  return (
    <section aria-labelledby="steps-h" className="ladder-section">
      <div className="section-head">
        <h2 id="steps-h">Resources</h2>
        <span className="row">
          <span className="small muted num">
            {summary.level} of {summary.max} finished
          </span>
          {addingTo === null && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAddingTo("")}>
              + Add resource
            </button>
          )}
        </span>
      </div>

      {addingTo === "" && form("")}

      {pillar.rungs.length === 0 && addingTo === null && (
        <div className="empty">
          <strong>Nothing on this roadmap yet</strong>
          <p className="small">
            Add the books, courses and projects you want to work through, in order. Give each one its number of
            chapters and they become nodes on the roadmap.
          </p>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setAddingTo("")}>
            Add the first resource
          </button>
        </div>
      )}

      {trackNames.map((track) => {
        const rungs = pillar.rungs.filter((r) => r.track === track);
        const t = summary.tracks.find((x) => x.name === track);
        return (
          <div key={track || "_"} className="track">
            {grouped && track && t && (
              <div className="track__head">
                <h3>{track}</h3>
                <Pips steps={rungs.map((r) => rungStatus(r, r.bookId ? bookById.get(r.bookId) : null))} label={track} />
                <span className="small muted num">
                  {t.level}/{t.max}
                </span>
                {addingTo === null && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Add a resource to ${track}`}
                    onClick={() => setAddingTo(track)}
                  >
                    +
                  </button>
                )}
              </div>
            )}
            <ol className="ladder">
              {rungs.map((r, i) => (
                <RungRow key={r.id} pillarId={pillarId} rung={r} n={i + 1} first={i === 0} last={i === rungs.length - 1} />
              ))}
            </ol>
            {addingTo === track && track !== "" && form(track)}
          </div>
        );
      })}
    </section>
  );
}

function RungRow({ pillarId, rung, n, first, last }: { pillarId: PillarId; rung: Rung; n: number; first: boolean; last: boolean }) {
  const book = useStore((s) => (rung.bookId ? s.books.find((b) => b.id === rung.bookId) : undefined));
  const toggleDone = useStore((s) => s.toggleRungDone);
  const toggleStarted = useStore((s) => s.toggleRungStarted);
  const update = useStore((s) => s.updateRung);
  const remove = useStore((s) => s.removeRung);
  const move = useStore((s) => s.moveRung);
  const toast = useToast((s) => s.show);
  const [editing, setEditing] = useState(false);

  const status = rungStatus(rung, book);
  const done = status === "done";
  const parts = rungParts(rung, book);
  const progress = !done && parts.total ? parts.done / parts.total : null;

  if (editing) {
    return (
      <li className="rung rung--editing">
        <RungForm
          pillarId={pillarId}
          initial={rung}
          submitLabel="Save"
          onSubmit={(patch) => {
            update(pillarId, rung.id, patch);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rung" data-step={status}>
      <button
        type="button"
        className="rung__marker"
        aria-pressed={done}
        aria-label={done ? `Mark ${rung.label} not finished` : `Mark ${rung.label} finished`}
        onClick={() => toggleDone(pillarId, rung.id)}
      >
        <span className="num">{done ? "✓" : n}</span>
      </button>
      <div className="rung__body">
        <span className="rung__label">
          {rung.url && isSafeUrl(rung.url) ? (
            <a className="link" href={rung.url} target="_blank" rel="noreferrer">
              {rung.label}
            </a>
          ) : (
            rung.label
          )}
        </span>
        <span className="rung__meta">
          {status === "doing" && <span className="rung__badge">in progress</span>}
          {done && rung.doneAt && <span>done {formatDate(rung.doneAt)}</span>}
          {book ? (
            <Link to={`/books/${book.id}`} className="rung__book num">
              {progressLabel(book)}
            </Link>
          ) : (
            parts.total && (
              <span className="num">
                {parts.done} of {parts.total} {parts.unit}s
              </span>
            )
          )}
          {rung.related.map((r) => (
            <Link key={r} to={`/pillar/${r}`} className="rel-chip" title={`Also builds ${PILLAR_BY_ID[r].title}`}>
              + {PILLAR_BY_ID[r].short}
            </Link>
          ))}
        </span>
        {progress != null && progress > 0 && <ProgressBar value={progress} label={`${rung.label} progress`} />}
      </div>
      <span className="rung__tools">
        {!done && (rung.startedAt || status === "todo") && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleStarted(pillarId, rung.id)}>
            {rung.startedAt ? "Pause" : "Start"}
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${rung.label} up`}
          disabled={first}
          onClick={() => move(pillarId, rung.id, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${rung.label} down`}
          disabled={last}
          onClick={() => move(pillarId, rung.id, 1)}
        >
          ↓
        </button>
        <button type="button" className="icon-btn" aria-label={`Edit ${rung.label}`} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${rung.label}`}
          onClick={() => {
            const before = useStore.getState().pillars[pillarId].rungs;
            remove(pillarId, rung.id);
            toast(`Removed “${rung.label}”`, {
              label: "Undo",
              run: () =>
                useStore.setState((s) => ({ pillars: { ...s.pillars, [pillarId]: { ...s.pillars[pillarId], rungs: before } } })),
            });
          }}
        >
          ✕
        </button>
      </span>
    </li>
  );
}

function RungForm({
  pillarId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  pillarId: PillarId;
  initial: Partial<Rung>;
  submitLabel: string;
  onSubmit: (rung: RungInput) => void;
  onCancel: () => void;
}) {
  const books = useStore((s) => s.books);
  const tracks = useStore((s) => [...new Set(s.pillars[pillarId].rungs.map((r) => r.track).filter(Boolean))].join("\n"));
  const [label, setLabel] = useState(initial.label ?? "");
  const [url, setUrl] = useState(initial.url ?? "");
  const [track, setTrack] = useState(initial.track ?? "");
  const [bookId, setBookId] = useState(initial.bookId ?? "");
  const [related, setRelated] = useState<PillarId[]>(initial.related ?? []);
  const [chapters, setChapters] = useState(initial.chapters ? String(initial.chapters) : "");
  const [unit, setUnit] = useState(initial.unit ?? "chapter");
  const [titles, setTitles] = useState((initial.chapterTitles ?? []).join("\n"));
  const linkedBook = books.find((b) => b.id === bookId);
  const normalized = normalizeUrl(url);
  const urlOk = normalized === "" || isSafeUrl(normalized);
  const valid = label.trim() !== "" && urlOk;
  const listId = `tracks-${pillarId}`;

  return (
    <form
      className="rung-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const titleList = titles.split("\n").map((t) => t.trim()).filter(Boolean);
        const count = Math.max(Number.parseInt(chapters, 10) || 0, titleList.length);
        onSubmit({
          label: label.trim(),
          url: normalized,
          track: track.trim(),
          bookId: bookId || null,
          related,
          chapters: count > 0 ? count : null,
          unit: unit.trim() || "chapter",
          chapterTitles: titleList,
        });
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <label className="field rung-form__wide">
        Resource
        <input
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Operating Systems: Three Easy Pieces"
          autoFocus
        />
      </label>
      <label className="field">
        <span>
          Link <span className="muted">(optional)</span>
        </span>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
      </label>
      <label className="field">
        <span>
          Track <span className="muted">(optional)</span>
        </span>
        <input
          className="input"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          list={listId}
          placeholder="e.g. Rust"
        />
        <datalist id={listId}>
          {tracks.split("\n").filter(Boolean).map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span>
          Linked book <span className="muted">(progress counts)</span>
        </span>
        <select className="select" value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">— None —</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </label>
      {linkedBook ? (
        <p className="small muted rung-form__wide">
          Chapters come from the book{linkedBook.totalChapters ? ` (${linkedBook.totalChapters})` : ""} — change the
          count on its{" "}
          <Link className="link" to={`/books/${linkedBook.id}`}>
            book page
          </Link>
          .
        </p>
      ) : (
        <>
          <label className="field">
            <span>
              Parts <span className="muted">(blank = one milestone)</span>
            </span>
            <input
              className="input"
              type="number"
              min={0}
              max={200}
              value={chapters}
              onChange={(e) => setChapters(e.target.value)}
              placeholder="e.g. 12"
            />
          </label>
          <label className="field">
            Called
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} list="unit-options" />
            <datalist id="unit-options">
              {["chapter", "module", "lecture", "project", "lab", "video", "paper", "topic"].map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
          <label className="field rung-form__wide">
            <span>
              Part titles <span className="muted">(optional, one per line)</span>
            </span>
            <textarea className="textarea" rows={3} value={titles} onChange={(e) => setTitles(e.target.value)} />
          </label>
        </>
      )}
      <fieldset className="field rung-form__wide rung-form__related">
        <legend>Also builds</legend>
        <div className="row">
          {PILLARS.filter((p) => p.id !== pillarId).map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={related.includes(p.id)}
              onClick={() => setRelated((r) => (r.includes(p.id) ? r.filter((x) => x !== p.id) : [...r, p.id]))}
            >
              {p.short}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="form-actions rung-form__wide">
        <button className="btn btn--primary btn--sm" type="submit" disabled={!valid}>
          {submitLabel}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>
          Cancel
        </button>
        {!urlOk && <span className="small" style={{ color: "var(--failed)" }}>That link doesn’t look right.</span>}
      </div>
    </form>
  );
}
