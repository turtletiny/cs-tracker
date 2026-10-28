## Computer Science Progression Tracker

- i want it to be more like a skill tracker, not a roadmap, each pillar has its own progression
- somehow visually represent the interconnectedness between them
- also add the interview as a pillar: behavioural, leetcode, system design, etc
- a simple page for my daily schedule

- cur programming roadmap -> finish rust book -> do the C course on boot.dev -> read a C book -> look at the MIPS stuff on UNSW


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
| **Roadmaps** (`/`) | One horizontal timeline per pillar, stacked. Each roadmap runs through its resources in order. A resource with chapters (or other parts: projects, labs, topics…) shows one node per part, followed by a ◆ completion milestone. Resources without parts are a single milestone. Click a node to mark everything up to it done (click it again to step back), and use arrow keys to move between nodes. Lanes open scrolled to where you are, and Interviewing has one lane per track. Below the timelines, the **web** shows how the pillars relate: lines turn solid once both ends have progress, and red threads are resources of yours that build more than one pillar. |
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
