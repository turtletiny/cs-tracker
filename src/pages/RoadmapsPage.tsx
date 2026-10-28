import { Link } from "react-router";
import { Cover } from "../components/Cover";
import { ProgressBar } from "../components/ProgressBar";
import { Roadmap } from "../components/Roadmap";
import { SkillWeb } from "../components/SkillWeb";
import { PILLAR_BY_ID, PILLARS } from "../data/pillars";
import { currentOrNext } from "../lib/schedule";
import { bookProgress, progressLabel } from "../lib/selectors";
import { useSkills } from "../lib/skills";
import { useNow } from "../lib/useNow";
import { useStore } from "../store";

export function RoadmapsPage() {
  const skills = useSkills();
  const totalLevels = PILLARS.reduce((n, p) => n + skills[p.id].level, 0);
  const maxLevels = PILLARS.reduce((n, p) => n + skills[p.id].max, 0);

  return (
    <div className="stack" style={{ gap: "var(--space-xl)" }}>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <span className="eyebrow">Teach yourself CS</span>
        <h1>The roadmaps</h1>
        <p className="lede">
          {totalLevels === 0
            ? "What you’re working on in each pillar, and what’s next. Start a resource with its circle, drag its bar as you go, and finish it with the diamond. Open a pillar for its full roadmap."
            : `${totalLevels} of ${maxLevels} resources finished. Here’s what’s on the go in each pillar and what’s next — open a pillar for its full roadmap.`}
        </p>
      </header>

      <div className="roadmaps">
        {PILLARS.map((p) => (
          <Roadmap key={p.id} pillarId={p.id} compact />
        ))}
      </div>

      <div className="home-lower">
        <SkillWeb skills={skills} />
        <MarginNotes />
      </div>
    </div>
  );
}

function MarginNotes() {
  const books = useStore((s) => s.books);
  const checklist = useStore((s) => s.checklist);
  const attempts = useStore((s) => s.attempts);
  const schedule = useStore((s) => s.schedule);
  const now = useNow();

  const reading = books.filter((b) => b.status === "reading");
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const thisWeek = attempts.filter((a) => new Date(a.at).getTime() >= weekAgo).length;
  const solvedIds = new Set(attempts.filter((a) => a.rating !== "failed").map((a) => a.problemId));
  const dsa = checklist.filter((c) => c.list === "dsa");
  const slot = currentOrNext(schedule, now);

  return (
    <aside className="margin-notes" aria-label="At a glance">
      <div className="note">
        <span className="note__label">{slot?.now ? "on now" : "up next today"}</span>
        {slot ? (
          <Link to="/schedule" className="note__slot">
            <span className="num small muted">
              {slot.block.start}–{slot.block.end}
            </span>
            <span className="note__title">{slot.block.label}</span>
            {slot.block.pillarId && <span className="tag">{PILLAR_BY_ID[slot.block.pillarId].short}</span>}
          </Link>
        ) : (
          <p className="small muted">
            {schedule.length === 0 ? "No schedule yet. " : "Nothing else planned today. "}
            <Link className="link" to="/schedule">
              {schedule.length === 0 ? "Plan your day →" : "See the schedule →"}
            </Link>
          </p>
        )}
      </div>

      <div className="note">
        <span className="note__label">reading now</span>
        {reading.length === 0 ? (
          <p className="small muted">
            Nothing on the go. Open a skill and log your first session, or{" "}
            <Link className="link" to="/books">
              pick from the book log
            </Link>
            .
          </p>
        ) : (
          reading.slice(0, 3).map((b) => (
            <Link key={b.id} to={`/books/${b.id}`} className="note__book">
              <Cover src={b.coverUrl} title={b.title} author={b.author} />
              <span className="stack-s">
                <span className="note__title">{b.title}</span>
                <span className="small muted num">{progressLabel(b)}</span>
                {bookProgress(b) != null && <ProgressBar value={bookProgress(b)!} label={`${b.title} progress`} />}
              </span>
            </Link>
          ))
        )}
      </div>

      <div className="note">
        <span className="note__label">leetcode</span>
        <p className="big-figure num">
          {thisWeek}
          <small> this week</small>
        </p>
        <p className="small muted">
          {solvedIds.size} distinct problems solved.{" "}
          <Link className="link" to="/leetcode">
            Draw a problem →
          </Link>
        </p>
      </div>

      <div className="note">
        <span className="note__label">implemented</span>
        <p className="big-figure num">
          {dsa.filter((c) => c.doneAt).length}
          <small> / {dsa.length}</small>
        </p>
        <p className="small muted">
          data structures &amp; algorithms from scratch.{" "}
          <Link className="link" to="/pillar/algorithms#checklist">
            Checklist
          </Link>
        </p>
      </div>
    </aside>
  );
}
