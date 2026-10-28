import { useState } from "react";
import { STORY_THEMES } from "../data/interview";
import { formatDate, todayISO } from "../lib/util";
import { useStore } from "../store";
import type { Story } from "../types";
import { useToast } from "./Toast";

const THEME_LABEL = Object.fromEntries(STORY_THEMES.map((t) => [t.id, t.label]));

export function StoryBank() {
  const stories = useStore((s) => s.stories);
  const addStory = useStore((s) => s.addStory);
  const [title, setTitle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const countFor = (theme: string) => stories.filter((s) => s.themes.includes(theme)).length;
  const covered = STORY_THEMES.filter((t) => countFor(t.id) > 0).length;

  return (
    <section aria-labelledby="stories-h" className="stack">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h2 id="stories-h">Behavioural story bank</h2>
        <span className="small muted num">
          {covered} of {STORY_THEMES.length} themes covered
        </span>
      </div>
      <p className="small muted" style={{ maxWidth: "60ch" }}>
        Write each story once — situation, task, action, result — then tag every prompt it can answer. Aim for
        at least one story per theme.
      </p>

      <ul className="themes" aria-label="Theme coverage">
        {STORY_THEMES.map((t) => (
          <li key={t.id} className="theme" data-covered={countFor(t.id) > 0}>
            {t.label}
            <span className="num">{countFor(t.id)}</span>
          </li>
        ))}
      </ul>

      {stories.length > 0 && (
        <ul className="stories">
          {stories.map((s) => (
            <StoryRow
              key={s.id}
              story={s}
              open={openId === s.id}
              onToggle={() => setOpenId((id) => (id === s.id ? null : s.id))}
            />
          ))}
        </ul>
      )}

      <form
        className="inline-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addStory(title.trim(), []);
          setTitle("");
          const added = useStore.getState().stories.at(-1);
          if (added) setOpenId(added.id);
        }}
      >
        <label className="visually-hidden" htmlFor="story-title">
          New story title
        </label>
        <input
          id="story-title"
          className="input"
          placeholder="New story, e.g. “Migrating the billing service”"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn--sm" disabled={!title.trim()}>
          Add story
        </button>
      </form>
    </section>
  );
}

function StoryRow({ story, open, onToggle }: { story: Story; open: boolean; onToggle: () => void }) {
  const update = useStore((s) => s.updateStory);
  const remove = useStore((s) => s.removeStory);
  const toast = useToast((s) => s.show);
  const practisedToday = story.practisedAt === todayISO();

  return (
    <li className="story" data-open={open}>
      <button type="button" className="story__summary" aria-expanded={open} onClick={onToggle}>
        <span className="story__title">{story.title}</span>
        <span className="story__tags">
          {story.themes.length === 0 ? (
            <span className="muted">no themes yet</span>
          ) : (
            story.themes.map((t) => <span key={t}>{THEME_LABEL[t] ?? t}</span>)
          )}
        </span>
        <span className="small muted num">
          {story.practisedAt ? `practised ${formatDate(story.practisedAt)}` : "not practised"}
        </span>
      </button>
      {open && (
        <div className="story__body">
          <label className="field">
            Title
            <input className="input" value={story.title} onChange={(e) => update(story.id, { title: e.target.value })} />
          </label>
          <div className="field">
            Answers
            <div className="row">
              {STORY_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="chip"
                  aria-pressed={story.themes.includes(t.id)}
                  onClick={() =>
                    update(story.id, {
                      themes: story.themes.includes(t.id) ? story.themes.filter((x) => x !== t.id) : [...story.themes, t.id],
                    })
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            The story
            <textarea
              className="ruled"
              value={story.notes}
              placeholder={"Situation —\nTask —\nAction —\nResult —"}
              onChange={(e) => update(story.id, { notes: e.target.value })}
            />
          </label>
          <div className="row between">
            <button
              type="button"
              className="btn btn--sm"
              disabled={practisedToday}
              onClick={() => update(story.id, { practisedAt: todayISO() })}
            >
              {practisedToday ? "Practised today ✓" : "Practised it out loud today"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--danger"
              onClick={() => {
                const before = useStore.getState().stories;
                remove(story.id);
                toast(`Removed “${story.title}”`, { label: "Undo", run: () => useStore.setState({ stories: before }) });
              }}
            >
              Remove story
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
