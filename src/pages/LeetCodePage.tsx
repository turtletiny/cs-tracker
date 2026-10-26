import { useMemo, useState } from "react";
import { RatingButtons } from "../components/RatingButtons";
import { Segmented } from "../components/Segmented";
import { useToast } from "../components/Toast";
import { TOPIC_BY_ID, TOPICS } from "../data/neetcode";
import { buildStats, candidatesFor, PICK_MODES, pickProblem, RATINGS, type PickMode, type ProblemStat } from "../lib/leetcode";
import { useAllProblems } from "../lib/selectors";
import { isSafeUrl, normalizeUrl, relativeDay } from "../lib/util";
import { useStore } from "../store";
import type { Difficulty, Problem, Rating, TopicId } from "../types";

const PICK_KEY = "cs-tracker:pick";

function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function LeetCodePage() {
  const problems = useAllProblems();
  const attempts = useStore((s) => s.attempts);
  const learnt = useStore((s) => s.learntTopics);
  const stats = useMemo(() => buildStats(attempts), [attempts]);

  const solved = new Set(attempts.filter((a) => a.rating !== "failed").map((a) => a.problemId)).size;
  const attempted = stats.size;

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Practice</span>
        <div className="page-head__row">
          <h1>LeetCode</h1>
        </div>
        <p className="lede">
          {attempts.length === 0
            ? "Mark the topics you’ve covered, draw a problem, then rate how it went."
            : `${solved} solved, ${attempted} attempted, ${attempts.length} attempts logged. Rate every attempt — the draw leans toward what you struggled with.`}
        </p>
      </header>

      <div className="lc-top">
        <Draw problems={problems} stats={stats} learnt={learnt} />
        <Topics problems={problems} stats={stats} learnt={learnt} />
      </div>

      <div className="lc-body">
        <ProblemList problems={problems} stats={stats} learnt={learnt} />
        <aside className="lc-body__aside stack" style={{ gap: "var(--space-l)" }}>
          <RecentAttempts problems={problems} />
          <AddProblem />
        </aside>
      </div>
    </>
  );
}

function Draw({ problems, stats, learnt }: { problems: Problem[]; stats: Map<string, ProblemStat>; learnt: TopicId[] }) {
  const rateProblem = useStore((s) => s.rateProblem);
  const removeAttempt = useStore((s) => s.removeAttempt);
  const [mode, setMode] = useState<PickMode>(() => readSession<PickMode>(`${PICK_KEY}:mode`, "smart"));
  const [pickId, setPickId] = useState<string | null>(() => readSession<string | null>(PICK_KEY, null));
  const [rated, setRated] = useState<Rating | null>(null);
  const [drawCount, setDrawCount] = useState(0);

  const pool = useMemo(() => problems.filter((p) => learnt.includes(p.topic)), [problems, learnt]);
  const candidates = candidatesFor(pool, stats, mode);
  const pick = problems.find((p) => p.id === pickId) ?? null;

  function draw(nextMode = mode) {
    const next = pickProblem(pool, stats, nextMode, { excludeId: pickId });
    setPickId(next?.id ?? null);
    setRated(null);
    setDrawCount((n) => n + 1);
    sessionStorage.setItem(PICK_KEY, JSON.stringify(next?.id ?? null));
  }

  function rate(r: Rating) {
    if (!pick) return;
    rateProblem(pick.id, r);
    setRated(r);
  }

  function undo() {
    if (!pick || !rated) return;
    const latest = useStore.getState().attempts.find((a) => a.problemId === pick.id);
    if (latest) removeAttempt(latest.id);
    setRated(null);
  }

  const stat = pick ? stats.get(pick.id) : undefined;
  const ratingLabel = rated ? RATINGS.find((r) => r.id === rated)!.label : "";

  return (
    <section className="draw" aria-labelledby="draw-h">
      <div className="draw__header">
        <h2 id="draw-h" className="hand" style={{ fontSize: "1.7rem", color: "var(--pencil-red)" }}>
          today’s draw
        </h2>
        <Segmented
          label="Draw mode"
          value={mode}
          options={PICK_MODES}
          onChange={(m) => {
            setMode(m);
            sessionStorage.setItem(`${PICK_KEY}:mode`, JSON.stringify(m));
          }}
        />
      </div>

      {learnt.length === 0 ? (
        <div className="draw__card">
          <p className="lede">Mark at least one topic as learnt and problems from it will show up here.</p>
        </div>
      ) : pick ? (
        <div className="draw__card" data-anim={drawCount > 0} key={`${pick.id}-${drawCount}`}>
          <div className="draw__meta">
            <span className="tag">{TOPIC_BY_ID[pick.topic].label}</span>
            <span className={`tag diff--${pick.difficulty}`}>{pick.difficulty}</span>
            {stat?.last ? (
              <span className="tag">
                <i className="rating-dot" data-rating={stat.last.rating} /> {stat.count}× · last {relativeDay(stat.last.at)}
              </span>
            ) : (
              <span className="tag">Unseen</span>
            )}
          </div>
          <a className="draw__title" href={pick.url} target="_blank" rel="noreferrer">
            {pick.title} <span aria-hidden="true" style={{ fontSize: "0.5em" }}>↗</span>
          </a>
        </div>
      ) : (
        <div className="draw__card">
          <p className="lede">
            {candidates.length === 0
              ? mode === "new"
                ? "You’ve attempted every problem in your learnt topics. Try another mode or mark a new topic."
                : mode === "review"
                  ? "Nothing to review — no problem in your learnt topics was last rated hard or failed."
                  : "No problems in your learnt topics."
              : `${candidates.length} problem${candidates.length === 1 ? "" : "s"} in the hat.`}
          </p>
        </div>
      )}

      {pick && !rated && <RatingButtons onRate={rate} />}

      {pick && rated && (
        <div className="row" style={{ gap: "var(--space-m)" }}>
          <span className="stamp rating-text" data-rating={rated}>
            {ratingLabel}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={undo}>
            Undo
          </button>
        </div>
      )}

      <div className="draw__footer">
        <span className="small muted">
          {learnt.length > 0 && (
            <>
              {PICK_MODES.find((m) => m.id === mode)!.hint}.
              <br />
              {`${candidates.length} of ${pool.length} problems across ${learnt.length} topic${learnt.length === 1 ? "" : "s"}`}
            </>
          )}
        </span>
        <button
          type="button"
          className={`btn ${!pick || rated ? "btn--primary" : ""}`}
          onClick={() => draw()}
          disabled={candidates.length === 0}
        >
          {pick ? "Draw another" : "Draw a problem"}
        </button>
      </div>
    </section>
  );
}

function Topics({ problems, stats, learnt }: { problems: Problem[]; stats: Map<string, ProblemStat>; learnt: TopicId[] }) {
  const toggle = useStore((s) => s.toggleTopic);
  const attempts = useStore((s) => s.attempts);

  const tally = useMemo(() => {
    const t: Record<Rating, number> = { easy: 0, good: 0, hard: 0, failed: 0 };
    for (const a of attempts) t[a.rating] += 1;
    return t;
  }, [attempts]);

  return (
    <section className="topics" aria-labelledby="topics-h">
      <div>
        <h2 id="topics-h">Topics learnt</h2>
        <p className="small muted">Only these feed the draw. Count shows attempted / total.</p>
      </div>
      <div className="topics__chips">
        {TOPICS.map((t) => {
          const inTopic = problems.filter((p) => p.topic === t.id);
          const done = inTopic.filter((p) => stats.has(p.id)).length;
          return (
            <button
              key={t.id}
              type="button"
              className="chip"
              aria-pressed={learnt.includes(t.id)}
              onClick={() => toggle(t.id)}
              title={t.label}
            >
              {t.label}
              <span className="chip__count">
                {done}/{inTopic.length}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tally" aria-label="All attempts by rating">
        {RATINGS.map((r) => (
          <div key={r.id}>
            <strong className="num">{tally[r.id]}</strong>
            <span className="rating-text" data-rating={r.id}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

type ShowFilter = "all" | "learnt" | "unseen" | "review";

function ProblemList({ problems, stats, learnt }: { problems: Problem[]; stats: Map<string, ProblemStat>; learnt: TopicId[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [show, setShow] = useState<ShowFilter>("all");
  const [open, setOpen] = useState<Set<TopicId>>(() => new Set(learnt));

  const q = query.trim().toLowerCase();
  const filtered = problems.filter((p) => {
    if (topic !== "all" && p.topic !== topic) return false;
    if (q && !p.title.toLowerCase().includes(q)) return false;
    const last = stats.get(p.id)?.last?.rating;
    if (show === "learnt" && !learnt.includes(p.topic)) return false;
    if (show === "unseen" && last) return false;
    if (show === "review" && last !== "hard" && last !== "failed") return false;
    return true;
  });

  const forceOpen = q !== "" || topic !== "all" || show !== "all";
  const groups = TOPICS.map((t) => ({ topic: t, items: filtered.filter((p) => p.topic === t.id) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <section aria-labelledby="list-h">
      <div className="section-head">
        <h2 id="list-h">NeetCode 150</h2>
        <span className="small muted num">{filtered.length} shown</span>
      </div>
      <div className="filters">
        <label className="visually-hidden" htmlFor="lc-search">
          Search problems
        </label>
        <input
          id="lc-search"
          className="input"
          type="search"
          placeholder="Search problems…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="visually-hidden" htmlFor="lc-topic">
          Topic
        </label>
        <select
          id="lc-topic"
          className="select"
          value={topic}
          onChange={(e) => setTopic(e.target.value as TopicId | "all")}
        >
          <option value="all">All topics</option>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <Segmented
          label="Show"
          value={show}
          onChange={setShow}
          options={[
            { id: "all", label: "All" },
            { id: "learnt", label: "Learnt" },
            { id: "unseen", label: "Unseen" },
            { id: "review", label: "Review" },
          ]}
        />
      </div>

      {groups.length === 0 && (
        <div className="empty">
          <strong>No problems match.</strong>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              setQuery("");
              setTopic("all");
              setShow("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {groups.map(({ topic: t, items }) => {
        const isOpen = forceOpen || open.has(t.id);
        return (
          <details
            key={t.id}
            className="topic-block"
            open={isOpen}
            onToggle={(e) => {
              if (forceOpen) return;
              const nowOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpen((prev) => {
                if (prev.has(t.id) === nowOpen) return prev;
                const next = new Set(prev);
                if (nowOpen) next.add(t.id);
                else next.delete(t.id);
                return next;
              });
            }}
          >
            <summary>
              <h3>
                {t.label}
                {learnt.includes(t.id) && <span className="learnt-mark">learnt</span>}
              </h3>
              <span className="small muted num">
                {items.filter((p) => stats.has(p.id)).length}/{items.length}
              </span>
            </summary>
            <div>
              {items.map((p) => (
                <ProblemRow key={p.id} problem={p} stat={stats.get(p.id)} />
              ))}
            </div>
          </details>
        );
      })}
    </section>
  );
}

function ProblemRow({ problem, stat }: { problem: Problem; stat: ProblemStat | undefined }) {
  const rateProblem = useStore((s) => s.rateProblem);
  const removeCustom = useStore((s) => s.removeCustomProblem);
  const toast = useToast((s) => s.show);
  const [rating, setRating] = useState(false);
  const last = stat?.last;

  return (
    <div className="problem">
      <i className="rating-dot" data-rating={last?.rating} title={last ? `Last: ${last.rating}` : "Unseen"} />
      <span className="stack-s" style={{ gap: 0 }}>
        <a className="problem__title" href={problem.url} target="_blank" rel="noreferrer">
          {problem.title}
        </a>
        <span className={`tag diff--${problem.difficulty}`} style={{ fontSize: "0.68rem" }}>
          {problem.difficulty}
          {problem.custom && <span className="muted"> · custom</span>}
        </span>
      </span>
      <span className="problem__history">
        {last ? (
          <>
            {stat.count}× · <span className="rating-text" data-rating={last.rating}>{last.rating}</span>{" "}
            {relativeDay(last.at)}
          </>
        ) : (
          "—"
        )}
      </span>
      <span className="row" style={{ gap: 2 }}>
        <button
          type="button"
          className={`btn btn--sm ${rating ? "" : "btn--ghost"}`}
          aria-expanded={rating}
          onClick={() => setRating((r) => !r)}
        >
          Rate
        </button>
        {problem.custom && (
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${problem.title}`}
            onClick={() => {
              removeCustom(problem.id);
              toast(`Deleted “${problem.title}”`);
            }}
          >
            ✕
          </button>
        )}
      </span>
      {rating && (
        <div className="problem__rate">
          <RatingButtons
            compact
            label={`Rate ${problem.title}`}
            onRate={(r) => {
              rateProblem(problem.id, r);
              setRating(false);
              toast(`${problem.title}: ${r}`);
            }}
          />
        </div>
      )}
    </div>
  );
}

function RecentAttempts({ problems }: { problems: Problem[] }) {
  const attempts = useStore((s) => s.attempts);
  const removeAttempt = useStore((s) => s.removeAttempt);
  const byId = useMemo(() => new Map(problems.map((p) => [p.id, p])), [problems]);
  const recent = attempts.slice(0, 12);

  return (
    <section aria-labelledby="recent-h">
      <div className="section-head">
        <h2 id="recent-h">Recent attempts</h2>
      </div>
      {recent.length === 0 ? (
        <p className="small muted">Every rating you give lands here, newest first.</p>
      ) : (
        <ul className="log">
          {recent.map((a) => (
            <li key={a.id}>
              <i className="rating-dot" data-rating={a.rating} />
              <span style={{ minWidth: 0 }}>
                {byId.get(a.problemId)?.title ?? a.problemId}
                <span className="muted"> · {relativeDay(a.at)}</span>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete this attempt"
                title="Delete this attempt"
                onClick={() => removeAttempt(a.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddProblem() {
  const add = useStore((s) => s.addCustomProblem);
  const toast = useToast((s) => s.show);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState<TopicId>("arrays-hashing");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");

  const normalized = normalizeUrl(url);
  const valid = title.trim() !== "" && normalized !== "" && isSafeUrl(normalized);

  if (!open) {
    return (
      <section>
        <div className="section-head">
          <h2>Off-list problems</h2>
        </div>
        <p className="small muted" style={{ marginBottom: "var(--space-s)" }}>
          Solved something outside the 150? Add it so it can be rated and drawn too.
        </p>
        <button type="button" className="btn btn--sm" onClick={() => setOpen(true)}>
          + Add a problem
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="section-head">
        <h2>Add a problem</h2>
      </div>
      <form
        className="stack-s"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          add({ title: title.trim(), url: normalized, topic, difficulty });
          toast(`Added “${title.trim()}”`);
          setTitle("");
          setUrl("");
          setOpen(false);
        }}
      >
        <label className="field">
          Title
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label className="field">
          URL
          <input
            className="input"
            value={url}
            onChange={(e) => {
              const v = e.target.value;
              setUrl(v);
              const slug = v.match(/leetcode\.com\/problems\/([^/?#]+)/)?.[1];
              if (slug && !title) {
                setTitle(slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
              }
            }}
            placeholder="https://leetcode.com/problems/…"
            inputMode="url"
          />
        </label>
        <label className="field">
          Topic
          <select className="select" value={topic} onChange={(e) => setTopic(e.target.value as TopicId)}>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Difficulty
          <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--sm" disabled={!valid}>
            Add problem
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
