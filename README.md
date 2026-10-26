## Computer Science Progression Tracker

## Features

- tree like roadmap structure with the 9 pillars of cs
    - [link(teachyourselfcs.com)]
    - similar to the roadmap on neetcode 150

- each pillar will have a book (showing an image of the book cover), and other resource links
- the cover and links should be editable

- dsa will have a checklist of data structures / algorithms to implemenent

- leetcode tracker
    - easy, good, hard, failed -> rate after every leetcode
    - feature to pick a random leetcode out of the topics currently learnt (array/hashing, stack, bs, 2ptr)

- book logger

this will be a web application

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
| **Roadmap** (`/`) | The nine subjects from teachyourselfcs.com as a prerequisite tree. Each node shows status and progress. |
| **Pillar** (`/pillar/:id`) | Book cover (editable by URL or upload), reading progress, editable/reorderable resource links, status, notes. Algorithms & DS also has the implement-from-scratch checklist. |
| **LeetCode** (`/leetcode`) | The NeetCode 150 plus your own problems. Toggle which topics you've learnt, draw a random problem from them, and rate every attempt Easy / Good / Hard / Failed. |
| **Books** (`/books`) | Book log with shelves (reading, up next, finished, set aside). Log reading sessions with the page reached, minutes and a note. |

**Draw modes:** *Smart* weights problems you haven't seen or last rated hard/failed (and ones you haven't touched
in a while). *Unseen*, *Review* (last rated hard or failed) and *Any* are plain filters.

### Code layout

```
src/
  data/        seed data: pillars & resources, NeetCode 150, DSA checklist
  lib/         pure helpers (random picker, formatting, selectors)
  components/  shared UI (cover, cover editor, rating buttons, reading form…)
  pages/       one file per route
  store.ts     zustand store, persisted to localStorage
  styles.css   design tokens and all styles
```
