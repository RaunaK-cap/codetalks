import { z } from "zod";

/*
 * Shapes shared by apps/api and apps/web.
 * The API validates every request and every model output against these.
 */

export const Role = z.enum(["backend", "frontend", "fullstack", "new_grad"]);
export type Role = z.infer<typeof Role>;

export const Dimension = z.enum(["depth", "correctness", "ownership", "communication", "tradeoffs"]);
export type Dimension = z.infer<typeof Dimension>;

export const Speaker = z.enum(["candidate", "interviewer"]);
export type Speaker = z.infer<typeof Speaker>;

/* GitHub: accepts "octocat", "@octocat", or "github.com/octocat" with or without https. */

const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function parseGithubLogin(input: string): string | null {
  const login =
    input
      .trim()
      .replace(/^@/, "")
      .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
      .split(/[/?#]/)[0] ?? "";
  return GITHUB_LOGIN.test(login) ? login : null;
}

export const GithubRepo = z.object({
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number().int(),
  forks: z.number().int(),
  topics: z.array(z.string()),
  isFork: z.boolean(),
  pushedAt: z.string(),
  defaultBranch: z.string(),
  url: z.string(),
});
export type GithubRepo = z.infer<typeof GithubRepo>;

export const GithubProfile = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  publicRepos: z.number().int(),
  followers: z.number().int(),
  createdAt: z.string(),
  url: z.string(),
  repos: z.array(GithubRepo),
  fetchedAt: z.string(),
});
export type GithubProfile = z.infer<typeof GithubProfile>;

/* LinkedIn: extracted from profile screenshots by a vision model. Unknown fields are null. */

export const LinkedinProfile = z.object({
  name: z.string().nullable(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  about: z.string().nullable(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      description: z.string().nullable(),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
    }),
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
});
export type LinkedinProfile = z.infer<typeof LinkedinProfile>;

/* Interview content */

export const Fact = z.object({
  id: z.string(),
  claim: z.string(),
  evidence: z.string(),
  source: z.enum(["github", "readme", "code", "linkedin"]),
  repo: z.string().nullable(),
});
export type Fact = z.infer<typeof Fact>;

export const FactSheet = z.object({
  summary: z.string(),
  facts: z.array(Fact),
  codeSamples: z.array(z.object({ path: z.string(), excerpt: z.string() })),
});
export type FactSheet = z.infer<typeof FactSheet>;

export const PlannedQuestion = z.object({
  id: z.string(),
  ask: z.string(),
  factIds: z.array(z.string()),
  dimension: Dimension,
  strongAnswerMentions: z.array(z.string()),
});
export type PlannedQuestion = z.infer<typeof PlannedQuestion>;

export const Plan = z.object({
  opener: z.string(),
  questions: z.array(PlannedQuestion).min(4).max(6),
});
export type Plan = z.infer<typeof Plan>;

export const ScreenVerdict = z.enum(["strong_yes", "yes", "maybe", "not_yet"]);
export type ScreenVerdict = z.infer<typeof ScreenVerdict>;

export const Report = z.object({
  overall: z.string(),
  screen: ScreenVerdict,
  strongest: z.string(),
  weakest: z.string(),
  scores: z.array(
    z.object({
      dimension: Dimension,
      score: z.number().int().min(1).max(5),
      quote: z.string(),
      gap: z.string(),
    }),
  ),
  perQuestion: z.array(
    z.object({
      questionId: z.string(),
      askedAs: z.string().nullable(),
      answered: z.boolean(),
      score: z.number().int().min(1).max(5).nullable(),
      verdict: z.string(),
      quote: z.string().nullable(),
      missing: z.array(z.string()),
    }),
  ),
  nextFocus: z.array(z.string()),
});
export type Report = z.infer<typeof Report>;

export const Line = z.object({
  seq: z.number().int().min(0),
  speaker: Speaker,
  text: z.string().min(1).max(4000),
});
export type Line = z.infer<typeof Line>;

/* Request bodies */

export const ConnectGithubBody = z.object({
  github: z.string().min(1).max(200),
});

/** Without `repo`, the interview covers the candidate's latest projects. With it, one repo in depth. */
export const CreateInterviewBody = z.object({
  candidateId: z.string().min(1),
  role: Role,
  repo: z.string().min(1).max(200).optional(),
});

export const AppendLineBody = Line;

/* Interview lifecycle, as the web page sees it */

export const InterviewStatus = z.enum([
  "preparing",
  "ready",
  "live",
  "finishing",
  "reported",
  "report_failed",
  "failed",
]);
export type InterviewStatus = z.infer<typeof InterviewStatus>;

export const PrepareStep = z.enum(["reading_repos", "building_fact_sheet", "writing_plan"]);
export type PrepareStep = z.infer<typeof PrepareStep>;

/* Responses, as the API sends them */

export type CandidateView = {
  id: string;
  github: GithubProfile;
  linkedin: LinkedinProfile | null;
  updatedAt: string;
};

/** The plan without the grader's answer key; safe to show before and during the call. */
export type PlanPreview = {
  opener: string;
  questions: Pick<PlannedQuestion, "id" | "ask" | "dimension" | "factIds">[];
};

export type Failure = { stage: "prepare" | "call" | "report"; reason: string };

type ViewBase = {
  id: string;
  candidateId: string;
  role: Role;
  /** "owner/name" of each repo the interview covers. One repo means a deep dive. */
  repos: string[];
  createdAt: string;
};

export type InterviewView = ViewBase &
  (
    | { status: "preparing"; step: PrepareStep | null }
    | { status: "ready" | "live"; summary: string; plan: PlanPreview; startedAt: string | null }
    | { status: "finishing"; startedAt: string; endedAt: string }
    | { status: "reported"; plan: Plan; report: Report; lines: Line[]; startedAt: string; endedAt: string }
    | { status: "report_failed"; failure: Failure | null; lines: Line[] }
    | { status: "failed"; failure: Failure | null }
  );

export type InterviewSummary = {
  id: string;
  status: InterviewStatus;
  role: Role;
  repos: string[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  scores: { dimension: Dimension; score: number }[] | null;
};

/** Passed unchanged to AgentSession.start({ sessionToken }). */
export type VoiceSessionToken = {
  transport: "livekit";
  session_id: string;
  token: string;
  livekit_url: string;
  expires_at: string;
  max_duration_seconds: number;
};

export type StartCallResponse = { session: VoiceSessionToken; interview: InterviewView };

export type ApiErrorBody = { error: { code: string; message: string } };
