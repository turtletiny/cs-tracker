export const SYSTEM_DESIGN_CHECKLIST: Record<string, string[]> = {
  "Building blocks": [
    "Back-of-the-envelope estimation",
    "Load balancing",
    "Caching and invalidation",
    "CDNs",
    "Replication",
    "Sharding and partitioning",
    "SQL vs NoSQL trade-offs",
    "Indexes",
    "Message queues and async work",
    "Consistent hashing",
    "CAP and consistency models",
    "Rate limiting",
  ],
  "Classic designs": [
    "URL shortener",
    "Rate limiter",
    "Key-value store",
    "News feed",
    "Chat system",
    "Notification system",
    "Search autocomplete",
    "Web crawler",
    "Video streaming",
    "File sync (Dropbox / Drive)",
  ],
};

/** Common behavioural prompts — aim for at least one story per theme. */
export const STORY_THEMES: { id: string; label: string }[] = [
  { id: "impact", label: "Biggest impact" },
  { id: "conflict", label: "Conflict" },
  { id: "failure", label: "Failure or mistake" },
  { id: "leadership", label: "Leading without authority" },
  { id: "ambiguity", label: "Ambiguity" },
  { id: "deadline", label: "Tight deadline" },
  { id: "learning", label: "Learning fast" },
  { id: "disagree", label: "Disagree and commit" },
  { id: "feedback", label: "Taking feedback" },
  { id: "helping", label: "Helping a teammate" },
];
