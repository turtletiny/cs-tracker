## Computer Science Progression Tracker

## Running it

Requires Node 20+.

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build
npm test           # unit tests
```

All data is stored in your browser's `localStorage`. Use **Export backup** in the footer to download
a JSON backup, and **Import backup** to restore it (on another browser or machine, too).

## How it's organised

| Page | What it does |
| --- | --- |
| **Roadmaps** (`/`) | One horizontal timeline per pillar, stacked. Each resource is a start ● and a finish ◆, joined by a progress bar for resources with chapters (or other parts: projects, labs, topics…). Click or drag the bar, or use the arrow keys, to set how far you've got; hovering shows which chapter you're pointing at. The overview shows only what you have on the go in each pillar (branching off side by side, as many at once as you like) plus the next resource after it; finished and later resources collapse into "✓ N done" / "+N more" links. A pillar's own page shows its full roadmap: finished on the left, in progress in the middle, the rest on the right. Interviewing has one lane per track. Below the timelines, the **web** shows how the pillars relate: lines turn solid once both ends have progress, and red threads are resources of yours that build more than one pillar. |
| **Pillar** (`/pillar/:id`) | The pillar's roadmap, plus the editable list of resources behind it (order, link, track, linked book or number of parts and their names, other pillars it builds). Progress on a book-linked resource is the book's chapter progress, so ticking chapters here and logging reading in the book log stay in sync. Also: connections to other pillars, the book you're on, links and notes. Algorithms & DS has the implement-from-scratch checklist. Interviewing has a LeetCode snapshot, a STAR story bank and a system design checklist. |
| **Schedule** (`/schedule`) | Time blocks per weekday, each optionally tagged with a skill. Today's view marks the block on now and lets you tick blocks off. Also shows weekly hours per skill and a streak. |
| **LeetCode** (`/leetcode`) | The NeetCode 150 plus your own problems. Toggle which topics you've learnt, draw a random problem from them, and rate every attempt Easy / Good / Hard / Failed. |
| **Books** (`/books`) | Book log with shelves (reading, up next, finished, set aside). Log reading sessions with the chapter reached, minutes and a note. |

**Draw modes:** *Smart* weights problems you haven't seen or last rated hard/failed (and ones you haven't touched
in a while). *Unseen*, *Review* (last rated hard or failed) and *Any* are plain filters.

### Code layout

```
src/
  data/        seed data: pillars, roadmaps & connections, chapter titles, NeetCode 150, checklists, story themes, sample schedule
  lib/         pure helpers (skill levels, schedule maths, random picker, formatting, selectors)
  components/  shared UI (roadmap timeline, skill web, resource list, level meters, checklist, story bank, cover, reading form…)
  pages/       one file per route
  store.ts     zustand store, persisted to localStorage
  styles.css   design tokens and all styles
```
