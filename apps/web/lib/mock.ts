/*
 * Demo data for the dashboard until the API exists.
 * Shapes follow the README contracts so swapping in real data is a fetch, not a rewrite.
 */

export const DIMENSIONS = [
  "depth",
  "correctness",
  "ownership",
  "communication",
  "tradeoffs",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  depth: "Depth",
  correctness: "Correctness",
  ownership: "Ownership",
  communication: "Communication",
  tradeoffs: "Tradeoffs",
};

export const ROLES = ["Backend", "Frontend", "Full-stack", "New grad"] as const;
export type Role = (typeof ROLES)[number];

export type SourceKind = "github" | "resume" | "linkedin";

export type InterviewSummary = {
  id: string;
  title: string;
  source: { kind: SourceKind; label: string };
  role: Role;
  date: string; // ISO
  durationSec: number;
  status: "reported" | "scoring";
  scores: Record<Dimension, number>;
};

export const user = { name: "Raunak", initials: "R", plan: "Free", dailyLimit: 3, usedToday: 1 };

export const interviews: InterviewSummary[] = [
  {
    id: "ledger-sync",
    title: "ledger-sync",
    source: { kind: "github", label: "raunak/ledger-sync" },
    role: "Backend",
    date: "2026-11-22T18:20:00Z",
    durationSec: 342,
    status: "reported",
    scores: { depth: 4, correctness: 3, ownership: 2, communication: 4, tradeoffs: 3 },
  },
  {
    id: "resume-nov",
    title: "Resume",
    source: { kind: "resume", label: "resume.pdf" },
    role: "Full-stack",
    date: "2026-11-20T15:05:00Z",
    durationSec: 355,
    status: "reported",
    scores: { depth: 3, correctness: 3, ownership: 2, communication: 4, tradeoffs: 2 },
  },
  {
    id: "pixel-board",
    title: "pixel-board",
    source: { kind: "github", label: "raunak/pixel-board" },
    role: "Frontend",
    date: "2026-11-17T11:40:00Z",
    durationSec: 301,
    status: "reported",
    scores: { depth: 3, correctness: 4, ownership: 3, communication: 3, tradeoffs: 3 },
  },
  {
    id: "linkedin-oct",
    title: "LinkedIn",
    source: { kind: "linkedin", label: "Profile.pdf" },
    role: "New grad",
    date: "2026-11-12T09:15:00Z",
    durationSec: 318,
    status: "reported",
    scores: { depth: 2, correctness: 3, ownership: 2, communication: 3, tradeoffs: 2 },
  },
  {
    id: "queue-worker",
    title: "queue-worker",
    source: { kind: "github", label: "raunak/queue-worker" },
    role: "Backend",
    date: "2026-11-08T20:30:00Z",
    durationSec: 287,
    status: "reported",
    scores: { depth: 3, correctness: 2, ownership: 2, communication: 3, tradeoffs: 2 },
  },
];

export function overall(scores: Record<Dimension, number>) {
  const v = DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length;
  return Math.round(v * 10) / 10;
}

export function average(dim: Dimension) {
  const done = interviews.filter((i) => i.status === "reported");
  return Math.round((done.reduce((s, i) => s + i.scores[dim], 0) / done.length) * 10) / 10;
}

export function weakest(): Dimension {
  return [...DIMENSIONS].sort((a, b) => average(a) - average(b))[0]!;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/* Sources */

export const sources = {
  github: {
    // Flip to true once the backend has read the user's GitHub.
    connected: false,
    login: "raunak",
    repoCount: 41,
    syncedAt: "2026-11-22T08:00:00Z",
    repos: [
      { name: "ledger-sync", lang: "TypeScript", stars: 48, pushed: "2d ago", description: "Pulls bank ledgers into Postgres on a schedule." },
      { name: "pixel-board", lang: "React", stars: 112, pushed: "6d ago", description: "Collaborative pixel canvas with live cursors." },
      { name: "queue-worker", lang: "Go", stars: 9, pushed: "3w ago", description: "Retrying job runner backed by Redis streams." },
      { name: "dotfiles", lang: "Shell", stars: 3, pushed: "1mo ago", description: "Personal machine setup." },
    ],
  },
  resume: { uploaded: true, file: "resume.pdf", pages: 2, uploadedAt: "2026-11-19T10:00:00Z" },
  linkedin: { uploaded: false },
};

/* One full report, reused for every id in the demo. */

export type ReportQuestion = {
  id: string;
  at: string;
  ask: string;
  cite: string;
  dimension: Dimension;
  score: number;
  youSaid: string;
  strongMentions: string[];
  missing: string[];
};

export const report = {
  summary:
    "Clear on how the sync loop works and why it retries. Weaker when asked what you personally decided: answers drifted to “the team”. The README’s real-time claim did not hold up against the polling code.",
  nextFocus: [
    "Say what you decided, in first person, with one reason.",
    "Explain idempotency for repeated writes before you are asked.",
    "Match README claims to what the code actually does.",
  ],
  questions: [
    {
      id: "q1",
      at: "00:14",
      ask: "Walk me through ledger-sync. What happens on one run?",
      cite: "src/sync.ts · L36",
      dimension: "communication",
      score: 4,
      youSaid: "It reads a cursor, pulls changes since then from the bank API, and applies them to Postgres in one transaction.",
      strongMentions: ["cursor", "batching", "transaction"],
      missing: [],
    },
    {
      id: "q2",
      at: "01:12",
      ask: "Your README says real-time sync. sync.ts polls every five seconds. Which one is it?",
      cite: "sync.ts · L42",
      dimension: "correctness",
      score: 3,
      youSaid: "Polling, honestly. Websockets were next on the list.",
      strongMentions: ["polling interval tradeoff", "bank API has no push", "update the README"],
      missing: ["Why the bank API forces polling"],
    },
    {
      id: "q3",
      at: "02:20",
      ask: "Why three retries in uploadFile, and which errors retry?",
      cite: "api/upload.ts · L88",
      dimension: "depth",
      score: 4,
      youSaid: "Only 5xx and timeouts retry. Three covered a slow minute without hammering the API.",
      strongMentions: ["backoff", "idempotency key", "alert on final failure"],
      missing: ["Idempotency for repeated writes"],
    },
    {
      id: "q4",
      at: "03:31",
      ask: "Your resume says you led the move to Kafka. What did you decide yourself?",
      cite: "resume.pdf · p1",
      dimension: "ownership",
      score: 2,
      youSaid: "The team decided on Kafka, I think. I wrote some of the consumers.",
      strongMentions: ["a decision you made", "the alternative you rejected", "the result"],
      missing: ["A first-person decision", "What you compared it with"],
    },
    {
      id: "q5",
      at: "04:40",
      ask: "If the sync runs twice at once, what breaks?",
      cite: "src/sync.ts · L37",
      dimension: "tradeoffs",
      score: 3,
      youSaid: "Both would read the same cursor, so rows could apply twice.",
      strongMentions: ["advisory lock", "unique constraint", "idempotent upsert"],
      missing: ["How you would prevent it"],
    },
  ] satisfies ReportQuestion[],
  transcript: [
    { at: "00:02", who: "interviewer", text: "Hi, thanks for joining. This will take about six minutes, and every question comes from ledger-sync." },
    { at: "00:14", who: "interviewer", text: "Walk me through ledger-sync. What happens on one run?" },
    { at: "00:31", who: "candidate", text: "It reads a cursor, pulls changes since then from the bank API, and applies them to Postgres in one transaction." },
    { at: "01:12", who: "interviewer", text: "Your README says real-time sync. sync.ts polls every five seconds. Which one is it?" },
    { at: "01:20", who: "candidate", text: "Polling, honestly. Websockets were next on the list." },
    { at: "02:20", who: "interviewer", text: "Why three retries in uploadFile, and which errors retry?" },
    { at: "02:40", who: "candidate", text: "Only 5xx and timeouts retry. Three covered a slow minute without hammering the API." },
    { at: "03:31", who: "interviewer", text: "Your resume says you led the move to Kafka. What did you decide yourself?" },
    { at: "03:45", who: "candidate", text: "The team decided on Kafka, I think. I wrote some of the consumers." },
    { at: "04:40", who: "interviewer", text: "If the sync runs twice at once, what breaks?" },
    { at: "04:52", who: "candidate", text: "Both would read the same cursor, so rows could apply twice." },
    { at: "05:38", who: "interviewer", text: "Good place to stop. Your report will be ready in a moment." },
  ] as { at: string; who: "interviewer" | "candidate"; text: string }[],
};

export function getInterview(id: string) {
  return interviews.find((i) => i.id === id) ?? interviews[0]!;
}

/* Plan preview shown on the new-interview page. */
export const planPreview = {
  opener: "Hi, thanks for joining. Every question today comes from your repo.",
  questions: report.questions.map(({ id, ask, cite, dimension }) => ({ id, ask, cite, dimension })),
};
