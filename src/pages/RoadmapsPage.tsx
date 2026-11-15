import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Cover } from "../components/Cover";
import { PillarForm } from "../components/PillarForm";
import { ProgressBar } from "../components/ProgressBar";
import { Roadmap } from "../components/Roadmap";
import { SkillWeb } from "../components/SkillWeb";
import { usePillarList } from "../lib/pillars";
import { currentOrNext } from "../lib/schedule";
import { bookProgress, progressLabel } from "../lib/selectors";
import { useSkills } from "../lib/skills";
import { useNow } from "../lib/useNow";
import { useStore } from "../store";

export function RoadmapsPage() {
  const skills = useSkills();
  const pillars = usePillarList();
  const totalLevels = pillars.reduce((n, p) => n + (skills[p.id]?.level ?? 0), 0);
  const maxLevels = pillars.reduce((n, p) => n + (skills[p.id]?.max ?? 0), 0);
  const working = pillars.filter((p) => p.focus);
  const later = pillars.filter((p) => !p.focus);

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

      <div>
        <div className="roadmaps">
          {working.length > 0 &&
            pillars
              .filter((p) => p.focus)
              .map((p) => <Roadmap key={p.id} pillarId={p.id} compact />)}
          {working.length > 0 && later.length > 0 && (
            <div className="rm-divider">
              <span>the rest</span>
            </div>
          )}
          {later.map((p) => (
            <Roadmap key={p.id} pillarId={p.id} compact />
          ))}
        </div>
        <AddPillar />
      </div>

      <div className="home-lower">
        <SkillWeb skills={skills} />
        <MarginNotes />
      </div>
    </div>
  );
}

function AddPillar() {
  const addPillar = useStore((s) => s.addPillar);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="add-pillar">
        <button type="button" className="btn btn--sm" onClick={() => setOpen(true)}>
          + Add a pillar
        </button>
      </div>
    );
  }
  return (
    <div className="add-pillar add-pillar--open">
      <h2 className="add-pillar__title">New pillar</h2>
      <PillarForm
        submitLabel="Add pillar"
        onSubmit={(info) => navigate(`/pillar/${addPillar(info)}`)}
        onCancel={() => setOpen(false)}
      />
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
  const slotPillar = useStore((s) => (slot?.block.pillarId ? s.pillars[slot.block.pillarId]?.short : undefined));

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
            {slotPillar && <span className="tag">{slotPillar}</span>}
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
