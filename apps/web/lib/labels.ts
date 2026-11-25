import type { Dimension, InterviewStatus, PrepareStep, Role, ScreenVerdict } from "@repo/contracts";

export const DIMENSIONS: Dimension[] = ["depth", "correctness", "ownership", "communication", "tradeoffs"];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  depth: "Depth",
  correctness: "Correctness",
  ownership: "Ownership",
  communication: "Communication",
  tradeoffs: "Tradeoffs",
};

export const ROLES: Role[] = ["backend", "frontend", "fullstack", "new_grad"];

export const ROLE_LABEL: Record<Role, string> = {
  backend: "Backend",
  frontend: "Frontend",
  fullstack: "Full-stack",
  new_grad: "New grad",
};

export const ROLE_HINT: Record<Role, string> = {
  backend: "APIs, data, reliability",
  frontend: "UI state, performance, a11y",
  fullstack: "End to end, tradeoffs",
  new_grad: "Fundamentals, projects",
};

export const STATUS_LABEL: Record<InterviewStatus, string> = {
  preparing: "Preparing",
  ready: "Ready",
  live: "Live",
  finishing: "Scoring",
  reported: "Done",
  report_failed: "No report",
  failed: "Failed",
};

export const STEP_LABEL: Record<PrepareStep, string> = {
  reading_repos: "Reading your GitHub",
  building_fact_sheet: "Building the fact sheet",
  writing_plan: "Writing the question plan",
};

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDuration(startIso: string | null, endIso: string | null): string | null {
  if (!startIso || !endIso) return null;
  const sec = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export const SCREEN_LABEL: Record<ScreenVerdict, string> = {
  strong_yes: "Strong pass",
  yes: "Would pass",
  maybe: "Borderline",
  not_yet: "Not yet",
};

export const repoName = (fullName: string) => fullName.split("/")[1] ?? fullName;

/** "ledger-sync" for a deep dive, "ledger-sync, pixel-board +1" for several. */
export function reposTitle(repos: string[]): string {
  const names = repos.map(repoName);
  return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/** Same setup again: the deep-dive repo if there was one, otherwise latest projects. */
export function practiceAgainHref(repos: string[]): string {
  return repos.length === 1 ? `/interviews/new?repo=${encodeURIComponent(repos[0]!)}` : "/interviews/new";
}
