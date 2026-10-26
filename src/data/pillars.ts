import type { PillarId } from "../types";

export interface PillarSeed {
  id: PillarId;
  title: string;
  short: string;
  why: string;
  book: {
    title: string;
    author: string;
    cover: string;
    pages: number | null;
  };
  resources: { label: string; url: string }[];
}

/** The nine subjects from teachyourselfcs.com, in the suggested order. */
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
      pages: 657,
    },
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
      pages: 1120,
    },
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
      pages: 730,
    },
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
      pages: 1048,
    },
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
      pages: 714,
    },
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
      pages: 864,
    },
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
      pages: null,
    },
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
      pages: 640,
    },
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
      pages: 616,
    },
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
];

export const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((p) => [p.id, p])) as Record<PillarId, PillarSeed>;

/**
 * Roadmap layout: grid row/column for each node, and prerequisite edges.
 * Edges follow the guide's advice: architecture before OS and databases,
 * networking and OS before distributed systems.
 */
export const ROADMAP_LAYOUT: Record<PillarId, { row: number; col: number }> = {
  programming: { row: 0, col: 1 },
  architecture: { row: 1, col: 0 },
  algorithms: { row: 1, col: 1 },
  math: { row: 1, col: 2 },
  os: { row: 2, col: 0 },
  databases: { row: 2, col: 1 },
  languages: { row: 2, col: 2 },
  networking: { row: 3, col: 0 },
  distributed: { row: 4, col: 1 },
};

export const ROADMAP_EDGES: [PillarId, PillarId][] = [
  ["programming", "architecture"],
  ["programming", "algorithms"],
  ["programming", "math"],
  ["architecture", "os"],
  ["architecture", "databases"],
  ["algorithms", "databases"],
  ["algorithms", "languages"],
  ["math", "languages"],
  ["os", "networking"],
  ["networking", "distributed"],
  ["databases", "distributed"],
];
