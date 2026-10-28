import type { PillarId } from "../types";
import {
  BOOTDEV_C_CHAPTERS,
  ESSENCE_OF_LINEAR_ALGEBRA,
  NAND2TETRIS_PART_1,
  NAND2TETRIS_PART_2,
  ROUGHGARDEN_COURSES,
} from "./chapters";
import { STORY_THEMES } from "./interview";
import { TOPICS } from "./neetcode";

export interface RungSeed {
  label: string;
  /** Earlier labels for this step, so saved data can be matched up on upgrade. */
  was?: string[];
  url?: string;
  track?: string;
  /** Link to the pillar's main book (true) or another seeded book by id. */
  book?: true | string;
  /** Named parts for a resource that isn't a book. */
  parts?: { unit: string; titles: string[] };
  related?: PillarId[];
  /** Seed as already in progress. */
  current?: boolean;
}

export interface BookSeed {
  id: string;
  pillarId: PillarId;
  title: string;
  author: string;
  cover: string;
  chapters: number | null;
}

/** Books used on roadmaps besides each pillar's main book. */
export const EXTRA_BOOKS: BookSeed[] = [
  {
    id: "book-rust",
    pillarId: "programming",
    title: "The Rust Programming Language",
    author: "Steve Klabnik, Carol Nichols & Chris Krycho",
    cover: "",
    chapters: 21,
  },
  {
    id: "book-knr",
    pillarId: "programming",
    title: "The C Programming Language",
    author: "Brian W. Kernighan & Dennis M. Ritchie",
    cover: "",
    chapters: 8,
  },
];

export interface PillarSeed {
  id: PillarId;
  title: string;
  short: string;
  why: string;
  book: {
    title: string;
    author: string;
    cover: string;
    chapters: number | null;
  };
  rungs: RungSeed[];
  resources: { label: string; url: string }[];
}

/** The nine subjects from teachyourselfcs.com, plus interviewing. */
export const PILLARS: PillarSeed[] = [
  {
    id: "programming",
    title: "Programming",
    short: "Programming",
    why: "Don’t be the person who “never quite understood” something like recursion.",
    book: {
      title: "Structure and Interpretation of Computer Programs",
      author: "Harold Abelson & Gerald Jay Sussman",
      cover: "/covers/sicp.jpg",
      chapters: 5,
    },
    rungs: [
      { label: "The Rust book", was: ["Finish the Rust book"], url: "https://doc.rust-lang.org/book/", book: "book-rust", current: true },
      {
        label: "Boot.dev — Memory Management in C",
        was: ["Boot.dev — Learn Memory Management in C"],
        url: "https://www.boot.dev/courses/learn-memory-management-c",
        parts: { unit: "chapter", titles: BOOTDEV_C_CHAPTERS },
        related: ["architecture"],
      },
      { label: "K&R — The C Programming Language", was: ["Read a C book (K&R or King’s C Programming)"], book: "book-knr", related: ["architecture"] },
      {
        label: "UNSW COMP1521 — MIPS",
        was: ["UNSW COMP1521 — the MIPS material"],
        url: "https://cgi.cse.unsw.edu.au/~cs1521/",
        related: ["architecture", "os"],
      },
      { label: "SICP", was: ["Work through SICP"], url: "https://sarabander.github.io/sicp/html/index.xhtml", book: true, related: ["languages"] },
    ],
    resources: [
      { label: "SICP — free online edition", url: "https://sarabander.github.io/sicp/html/index.xhtml" },
      {
        label: "Brian Harvey’s CS 61A lectures",
        url: "https://archive.org/details/ucberkeley-webcast-PL3E89002AA9B9879E?sort=titleSorter",
      },
      { label: "Composing Programs (Python alternative)", url: "https://composingprograms.com/" },
      { label: "Exercism practice problems", url: "https://exercism.org" },
    ],
  },
  {
    id: "architecture",
    title: "Computer Architecture",
    short: "Architecture",
    why: "Without a solid mental model of how a computer actually works, all of your higher-level abstractions will be brittle.",
    book: {
      title: "Computer Systems: A Programmer’s Perspective",
      author: "Randal E. Bryant & David R. O’Hallaron",
      cover: "/covers/csapp.jpg",
      chapters: 12,
    },
    rungs: [
      {
        label: "Nand2Tetris part I",
        was: ["Nand2Tetris part I — build the hardware"],
        url: "https://www.nand2tetris.org",
        parts: { unit: "project", titles: NAND2TETRIS_PART_1 },
      },
      { label: "CS:APP", was: ["Read CS:APP"], book: true, related: ["programming"] },
      {
        label: "CS:APP labs",
        was: ["CS:APP labs — data, bomb, attack"],
        url: "http://csapp.cs.cmu.edu/3e/labs.html",
        parts: { unit: "lab", titles: ["Data lab", "Bomb lab", "Attack lab"] },
        related: ["programming"],
      },
      {
        label: "Nand2Tetris part II",
        was: ["Nand2Tetris part II — assembler, VM, compiler"],
        url: "https://www.nand2tetris.org",
        parts: { unit: "project", titles: NAND2TETRIS_PART_2 },
        related: ["languages", "os"],
      },
    ],
    resources: [
      { label: "CS:APP book site", url: "http://csapp.cs.cmu.edu/3e/home.html" },
      {
        label: "Berkeley CS 61C lectures",
        url: "https://archive.org/details/ucberkeley-webcast-PL-XXv-cvA_iCl2-D-FS5mk0jFF6cYSJs_",
      },
      { label: "Nand2Tetris", url: "https://www.nand2tetris.org" },
      { label: "Build a Modern Computer (Coursera)", url: "https://www.coursera.org/learn/build-a-computer" },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms & Data Structures",
    short: "Algorithms & DS",
    why: "Without knowing ubiquitous data structures like stacks, queues, trees and graphs, you won’t be able to solve challenging problems.",
    book: {
      title: "The Algorithm Design Manual",
      author: "Steven S. Skiena",
      cover: "/covers/skiena.jpg",
      chapters: 19,
    },
    rungs: [
      { label: "Implement the core data structures", was: ["Implement the core data structures from scratch"] },
      { label: "The Algorithm Design Manual", was: ["Read The Algorithm Design Manual"], book: true },
      { label: "Skiena’s lectures", url: "https://www3.cs.stonybrook.edu/~skiena/373/videos/" },
      { label: "Implement the graph and DP algorithms", was: ["Implement the graph and DP algorithms from scratch"], related: ["math"] },
      {
        label: "Roughgarden’s Algorithms",
        was: ["Roughgarden’s Algorithms specialization"],
        url: "https://www.coursera.org/specializations/algorithms",
        parts: { unit: "course", titles: ROUGHGARDEN_COURSES },
        related: ["math"],
      },
    ],
    resources: [
      { label: "Steven Skiena’s lectures", url: "https://www3.cs.stonybrook.edu/~skiena/373/videos/" },
      { label: "Tim Roughgarden’s Algorithms (Coursera)", url: "https://www.coursera.org/specializations/algorithms" },
      { label: "NeetCode roadmap", url: "https://neetcode.io/roadmap" },
      { label: "LeetCode", url: "https://leetcode.com" },
    ],
  },
  {
    id: "math",
    title: "Math for CS",
    short: "Math for CS",
    why: "CS is basically a runaway branch of applied math, so learning math will give you a competitive advantage.",
    book: {
      title: "Mathematics for Computer Science",
      author: "Eric Lehman, F. Thomson Leighton & Albert R. Meyer",
      cover: "/covers/mcs.jpg",
      chapters: 22,
    },
    rungs: [
      { label: "Mathematics for Computer Science", was: ["Read Mathematics for Computer Science"], book: true },
      {
        label: "MIT 6.042J lectures",
        url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/video_galleries/video-lectures/",
      },
      {
        label: "Lovász’s discrete math notes",
        was: ["Lovász — discrete math notes"],
        url: "https://cims.nyu.edu/~regev/teaching/discrete_math_fall_2005/dmbook.pdf",
        related: ["algorithms"],
      },
      {
        label: "Essence of linear algebra",
        was: ["3Blue1Brown — Essence of linear algebra"],
        url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
        parts: { unit: "video", titles: ESSENCE_OF_LINEAR_ALGEBRA },
      },
    ],
    resources: [
      { label: "MCS — free PDF", url: "https://courses.csail.mit.edu/6.042/spring18/mcs.pdf" },
      {
        label: "Tom Leighton’s MIT 6.042J lectures",
        url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/video_galleries/video-lectures/",
      },
      {
        label: "László Lovász — discrete math notes",
        url: "https://cims.nyu.edu/~regev/teaching/discrete_math_fall_2005/dmbook.pdf",
      },
      {
        label: "3Blue1Brown — Essence of linear algebra",
        url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
      },
    ],
  },
  {
    id: "os",
    title: "Operating Systems",
    short: "Operating Systems",
    why: "Most of the code you write is run by an operating system, so you should know how those interact.",
    book: {
      title: "Operating Systems: Three Easy Pieces",
      author: "Remzi & Andrea Arpaci-Dusseau",
      cover: "/covers/ostep.jpg",
      chapters: 50,
    },
    rungs: [
      { label: "OSTEP", was: ["Read OSTEP"], url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", book: true },
      { label: "OSTEP homework simulators", url: "https://github.com/remzi-arpacidusseau/ostep-homework" },
      { label: "xv6 lab projects", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/lab-projects-xv6.pdf", related: ["architecture"] },
      { label: "Berkeley CS 162", url: "https://cs162.org/" },
    ],
    resources: [
      { label: "OSTEP — free online", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" },
      { label: "Berkeley CS 162", url: "https://cs162.org/" },
      { label: "xv6 teaching kernel", url: "https://pdos.csail.mit.edu/6.828/2016/xv6.html" },
      { label: "OSTEP xv6 lab projects", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/lab-projects-xv6.pdf" },
    ],
  },
  {
    id: "networking",
    title: "Computer Networking",
    short: "Networking",
    why: "The Internet turned out to be a big deal: understand how it works to unlock its full potential.",
    book: {
      title: "Computer Networking: A Top-Down Approach",
      author: "James Kurose & Keith Ross",
      cover: "/covers/top-down.jpg",
      chapters: 9,
    },
    rungs: [
      { label: "Kurose & Ross", was: ["Read Computer Networking: A Top-Down Approach"], book: true },
      { label: "Wireshark labs", url: "http://www-net.cs.umass.edu/wireshark-labs/" },
      { label: "HTTP server on raw sockets", was: ["Write an HTTP server on raw sockets"], related: ["os", "programming"] },
      {
        label: "Stanford CS 144 lectures",
        url: "https://www.youtube.com/playlist?list=PLoCMsyE1cvdWKsLVyf6cPwCLDIZnOj0NS",
      },
    ],
    resources: [
      { label: "Wireshark labs", url: "http://www-net.cs.umass.edu/wireshark-labs/" },
      {
        label: "Stanford CS 144 lectures",
        url: "https://www.youtube.com/playlist?list=PLoCMsyE1cvdWKsLVyf6cPwCLDIZnOj0NS",
      },
    ],
  },
  {
    id: "databases",
    title: "Databases",
    short: "Databases",
    why: "Data is at the heart of most significant programs, but few understand how database systems actually work.",
    book: {
      title: "Readings in Database Systems (the Red Book)",
      author: "Peter Bailis, Joseph M. Hellerstein & Michael Stonebraker",
      cover: "/covers/redbook.jpg",
      chapters: 11,
    },
    rungs: [
      { label: "CS 186 lectures", was: ["Hellerstein’s CS 186 lectures"], url: "https://www.youtube.com/user/CS186Berkeley/videos" },
      { label: "Architecture of a Database System", url: "http://db.cs.berkeley.edu/papers/fntdb07-architecture.pdf" },
      { label: "The Red Book", was: ["Read the Red Book"], url: "http://www.redbook.io/", book: true },
      { label: "Build a toy database", url: "https://cstack.github.io/db_tutorial/", related: ["algorithms", "os"] },
    ],
    resources: [
      { label: "Joe Hellerstein’s CS 186 lectures", url: "https://www.youtube.com/user/CS186Berkeley/videos" },
      { label: "Architecture of a Database System (paper)", url: "http://db.cs.berkeley.edu/papers/fntdb07-architecture.pdf" },
      { label: "The Red Book — free online", url: "http://www.redbook.io/" },
    ],
  },
  {
    id: "languages",
    title: "Languages & Compilers",
    short: "Languages & Compilers",
    why: "Understand how languages and compilers actually work and you’ll write better code and learn new languages more easily.",
    book: {
      title: "Crafting Interpreters",
      author: "Robert Nystrom",
      cover: "/covers/crafting-interpreters.jpg",
      chapters: 30,
    },
    rungs: [
      { label: "Crafting Interpreters", was: ["Read Crafting Interpreters"], url: "https://craftinginterpreters.com/contents.html", book: true },
      { label: "Port clox to Rust", related: ["programming", "architecture"] },
      { label: "Aiken’s Compilers", was: ["Alex Aiken’s Compilers"], url: "https://www.edx.org/course/compilers" },
      { label: "The Dragon Book", was: ["Dip into the Dragon Book"], url: "https://www.amazon.com/Compilers-Principles-Techniques-Tools-2nd/dp/0321486811" },
    ],
    resources: [
      { label: "Crafting Interpreters — free online", url: "https://craftinginterpreters.com/contents.html" },
      { label: "Alex Aiken’s Compilers (edX)", url: "https://www.edx.org/course/compilers" },
      {
        label: "The Dragon Book (reference)",
        url: "https://www.amazon.com/Compilers-Principles-Techniques-Tools-2nd/dp/0321486811",
      },
    ],
  },
  {
    id: "distributed",
    title: "Distributed Systems",
    short: "Distributed Systems",
    why: "These days, most systems are distributed systems.",
    book: {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      cover: "/covers/ddia.jpg",
      chapters: 12,
    },
    rungs: [
      { label: "DDIA", was: ["Read Designing Data-Intensive Applications"], book: true, related: ["databases", "interview"] },
      {
        label: "MIT 6.824 lectures",
        url: "https://www.youtube.com/watch?v=cQP8WApzIQQ&list=PLrw6a1wE39_tb2fErI4-WkMbsvGQk9_UB",
      },
      { label: "6.824 labs — Raft", was: ["6.824 labs — implement Raft"], url: "https://pdos.csail.mit.edu/6.824/schedule.html", related: ["networking"] },
      {
        label: "The classic papers",
        was: ["Read MapReduce, GFS, Dynamo and Spanner"],
        url: "https://pdos.csail.mit.edu/6.824/schedule.html",
        parts: { unit: "paper", titles: ["MapReduce", "GFS", "Raft", "Dynamo", "Spanner"] },
        related: ["databases"],
      },
    ],
    resources: [
      {
        label: "MIT 6.824 lectures",
        url: "https://www.youtube.com/watch?v=cQP8WApzIQQ&list=PLrw6a1wE39_tb2fErI4-WkMbsvGQk9_UB",
      },
      { label: "MIT 6.824 readings", url: "https://pdos.csail.mit.edu/6.824/schedule.html" },
      { label: "Distributed Systems, 3rd ed. (free)", url: "https://www.distributed-systems.net/index.php/books/ds3/" },
      { label: "Papers We Love", url: "https://paperswelove.org/" },
    ],
  },
  {
    id: "interview",
    title: "Interviewing",
    short: "Interviewing",
    why: "Every other pillar eventually gets tested in a room with a whiteboard — this is where they all meet.",
    book: {
      title: "System Design Interview – An Insider’s Guide",
      author: "Alex Xu",
      cover: "",
      chapters: 16,
    },
    rungs: [
      {
        label: "STAR stories for every theme",
        was: ["Write STAR stories for every core theme"],
        track: "Behavioural",
        parts: { unit: "theme", titles: STORY_THEMES.map((t) => t.label) },
      },
      { label: "90-second “tell me about yourself”", was: ["Nail a 90-second “tell me about yourself”"], track: "Behavioural" },
      { label: "Mock behavioural interview", track: "Behavioural" },
      {
        label: "NeetCode 150",
        was: ["NeetCode 150 — arrays through binary search"],
        track: "LeetCode",
        url: "https://neetcode.io/roadmap",
        parts: { unit: "topic", titles: TOPICS.map((t) => t.label) },
        current: true,
        related: ["algorithms"],
      },
      { label: "Timed mock coding interview", track: "LeetCode" },
      {
        label: "System Design Interview",
        was: ["Read System Design Interview"],
        track: "System design",
        book: true,
        related: ["distributed"],
      },
      {
        label: "Classic systems on paper",
        was: ["Design the classic systems on paper"],
        track: "System design",
        related: ["distributed", "databases", "networking"],
      },
      { label: "Mock system design interview", track: "System design" },
      { label: "One-page résumé, reviewed", was: ["One-page résumé, reviewed by someone else"], track: "Applications" },
      { label: "A project write-up worth talking about", was: ["Write up a project worth talking about"], track: "Applications", related: ["programming"] },
    ],
    resources: [
      { label: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org/" },
      { label: "NeetCode", url: "https://neetcode.io/" },
      { label: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
      { label: "ByteByteGo", url: "https://bytebytego.com/" },
    ],
  },
];

export const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((p) => [p.id, p])) as Record<PillarId, PillarSeed>;

/**
 * How the subjects feed each other. These aren’t prerequisites — just the
 * places where studying one makes another click.
 */
export const CONNECTIONS: { a: PillarId; b: PillarId; why: string }[] = [
  { a: "programming", b: "algorithms", why: "recursion, abstraction, complexity in practice" },
  { a: "programming", b: "languages", why: "evaluation, closures, type systems" },
  { a: "programming", b: "architecture", why: "C, pointers, memory layout" },
  { a: "programming", b: "math", why: "induction, invariants, proving code correct" },
  { a: "architecture", b: "os", why: "interrupts, virtual memory, privilege levels" },
  { a: "architecture", b: "languages", why: "assembly, calling conventions, code generation" },
  { a: "algorithms", b: "math", why: "asymptotics, combinatorics, proofs" },
  { a: "algorithms", b: "databases", why: "B-trees, hashing, join and sort algorithms" },
  { a: "math", b: "languages", why: "logic, grammars, type theory" },
  { a: "os", b: "networking", why: "sockets and the kernel network stack" },
  { a: "os", b: "databases", why: "buffer pools, file systems, concurrency" },
  { a: "networking", b: "distributed", why: "RPC, latency, partitions" },
  { a: "databases", b: "distributed", why: "replication, transactions, consensus" },
  { a: "interview", b: "algorithms", why: "the LeetCode rounds" },
  { a: "interview", b: "distributed", why: "system design rounds" },
  { a: "interview", b: "databases", why: "data modelling and storage choices" },
  { a: "interview", b: "networking", why: "“what happens when you type a URL?”" },
  { a: "interview", b: "programming", why: "fluency in your interview language" },
  { a: "interview", b: "os", why: "concurrency, processes vs threads" },
];

/** Order around the skill web; interview sits at the hub. */
export const WEB_RING: PillarId[] = [
  "programming",
  "languages",
  "math",
  "algorithms",
  "databases",
  "distributed",
  "networking",
  "os",
  "architecture",
];
export const WEB_HUB: PillarId = "interview";
