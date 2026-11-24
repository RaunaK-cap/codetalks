import {
  FactSheet,
  GithubProfile,
  LinkedinProfile,
  Plan,
  Report,
  type Failure,
  type InterviewStatus,
  type InterviewSummary,
  type InterviewView,
  type Line,
  type PlanPreview,
  type PrepareStep,
  type Role,
  type StartCallResponse,
  type VoiceSessionToken,
} from "@repo/contracts";
import type { Interview } from "../generated/prisma/client";
import { HttpError, conflict, notFound } from "../lib/http-error";
import { assertMove } from "../lib/interview-machine";
import { prisma } from "../lib/prisma";
import { interviewerPrompt } from "../lib/prompts";
import { assertCallBudget } from "./budget.service";
import { loadRepoMaterial, pickRepo } from "./github.service";
import { buildFactSheet, writePlan } from "./prep.service";
import { scoreInterview } from "./scoring.service";
import { voice } from "./voice.service";

/*
 * The interview aggregate. This is the only module that changes an interview's status.
 * Long work (prepare, finish) runs in the background; the page polls getInterview().
 */

const STALE_PREPARE_MS = 3 * 60_000;
const STALE_FINISH_MS = 3 * 60_000;
const MAX_LIVE_MS = 7 * 60_000;

/* ---------- Views: what the page is allowed to see per status ---------- */

function planPreview(plan: Plan): PlanPreview {
  // strongAnswerMentions is the grader's answer key; it never leaves the server.
  return {
    opener: plan.opener,
    questions: plan.questions.map(({ id, ask, dimension, factIds }) => ({ id, ask, dimension, factIds })),
  };
}

async function transcript(interviewId: string): Promise<Line[]> {
  const rows = await prisma.line.findMany({ where: { interviewId }, orderBy: { seq: "asc" } });
  const provider = rows.filter((r) => r.origin === "provider");
  const chosen = provider.length ? provider : rows.filter((r) => r.origin === "live");
  return chosen.map((r) => ({ seq: r.seq, speaker: r.speaker as Line["speaker"], text: r.text }));
}

export async function toView(row: Interview): Promise<InterviewView> {
  const status = row.status as InterviewStatus;
  const base = {
    id: row.id,
    candidateId: row.candidateId,
    status,
    role: row.role as Role,
    repo: row.repo,
    createdAt: row.createdAt.toISOString(),
  };
  const plan = row.plan ? Plan.parse(row.plan) : null;
  const failure = (row.failure as Failure | null) ?? null;

  switch (status) {
    case "preparing":
      return { ...base, status, step: row.step as PrepareStep | null };
    case "ready":
    case "live":
      return {
        ...base,
        status,
        summary: FactSheet.parse(row.factSheet).summary,
        plan: planPreview(plan!),
        startedAt: row.startedAt?.toISOString() ?? null,
      };
    case "finishing":
      return { ...base, status, startedAt: row.startedAt!.toISOString(), endedAt: row.endedAt!.toISOString() };
    case "reported":
      return {
        ...base,
        status,
        plan: plan!, // the call is over, so the answer key can be shown next to the answers
        report: Report.parse(row.report),
        lines: await transcript(row.id),
        startedAt: row.startedAt!.toISOString(),
        endedAt: row.endedAt!.toISOString(),
      };
    case "report_failed":
      return { ...base, status, failure, lines: await transcript(row.id) };
    case "failed":
      return { ...base, status, failure };
  }
}

/* ---------- Status changes ---------- */

/** Moves status only if it is still `from`, so two requests can never both win. */
async function move(id: string, from: InterviewStatus, to: InterviewStatus, data: Parameters<typeof prisma.interview.updateMany>[0]["data"] = {}) {
  assertMove(from, to);
  const { count } = await prisma.interview.updateMany({ where: { id, status: from }, data: { ...data, status: to } });
  if (count === 0) throw conflict("stale_state", `Interview is no longer ${from}.`);
}

async function load(id: string): Promise<Interview> {
  const row = await prisma.interview.findUnique({ where: { id } });
  if (!row) throw notFound("Interview");
  return row;
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/* ---------- Create and prepare ---------- */

export async function createInterview(input: { candidateId: string; role: Role; repo?: string; ip: string }) {
  const candidate = await prisma.candidate.findUnique({ where: { id: input.candidateId } });
  if (!candidate) throw notFound("Candidate");

  // An interview only starts from a GitHub profile we have already read.
  const github = GithubProfile.parse(candidate.github);
  const repo = pickRepo(github, input.repo);

  const row = await prisma.interview.create({
    data: {
      candidateId: candidate.id,
      role: input.role,
      repo: repo.fullName,
      status: "preparing",
      step: "reading_repo",
      clientIp: input.ip,
    },
  });

  void prepare(row.id).catch((e) => console.error(`prepare ${row.id} crashed:`, e));
  return toView(row);
}

async function setStep(id: string, step: PrepareStep) {
  await prisma.interview.updateMany({ where: { id, status: "preparing" }, data: { step } });
}

async function prepare(id: string): Promise<void> {
  try {
    const row = await prisma.interview.findUniqueOrThrow({ where: { id }, include: { candidate: true } });
    const github = GithubProfile.parse(row.candidate.github);
    const linkedin = row.candidate.linkedin ? LinkedinProfile.parse(row.candidate.linkedin) : null;
    const repo = pickRepo(github, row.repo);
    const role = row.role as Role;

    const material = await loadRepoMaterial(repo);
    await setStep(id, "building_fact_sheet");
    const factSheet = await buildFactSheet({ role, github, repo, material, linkedin });
    await setStep(id, "writing_plan");
    const plan = await writePlan({ role, repo, factSheet });

    await move(id, "preparing", "ready", { factSheet, plan, step: null });
  } catch (error) {
    console.error(`prepare ${id} failed:`, error);
    await move(id, "preparing", "failed", {
      failure: { stage: "prepare", reason: reason(error) } satisfies Failure,
    }).catch(() => {});
  }
}

/* ---------- Call ---------- */

export async function startCall(id: string, ip: string): Promise<StartCallResponse> {
  const row = await prisma.interview.findUnique({ where: { id }, include: { candidate: true } });
  if (!row) throw notFound("Interview");
  if (row.status !== "ready") throw conflict("not_ready", `Interview is ${row.status}; a call can only start when it is ready.`);

  await assertCallBudget(ip);

  const github = GithubProfile.parse(row.candidate.github);
  const plan = Plan.parse(row.plan);
  const { sessionId, clientToken } = await voice.start({
    interviewId: id,
    candidateId: row.candidateId,
    title: `${github.login} · ${row.repo}`,
    systemPrompt: interviewerPrompt({
      role: row.role as Role,
      candidateName: github.name ?? github.login,
      repo: row.repo,
      plan,
    }),
    firstMessage: plan.opener,
  });

  try {
    await move(id, "ready", "live", { providerSessionId: sessionId, startedAt: new Date(), clientIp: ip });
  } catch (error) {
    await voice.end(sessionId).catch(() => {});
    throw error;
  }
  return { session: clientToken as VoiceSessionToken, interview: await toView(await load(id)) };
}

/** Saves one finalized line from the browser. Retries with the same seq are ignored. */
export async function appendLine(id: string, line: Line): Promise<void> {
  const row = await load(id);
  if (row.status !== "live" && row.status !== "finishing") {
    throw conflict("not_live", `Interview is ${row.status}; lines can only be added during the call.`);
  }
  await prisma.line.upsert({
    where: { interviewId_origin_seq: { interviewId: id, origin: "live", seq: line.seq } },
    create: { interviewId: id, origin: "live", seq: line.seq, speaker: line.speaker, text: line.text, at: new Date() },
    update: {},
  });
}

/** Ends the call. Safe to call more than once. */
export async function endInterview(id: string) {
  const row = await load(id);
  if (row.status === "live") {
    await move(id, "live", "finishing", { endedAt: new Date() }).catch((e) => {
      // Another request ended it first; that's fine.
      if (!(e instanceof HttpError && e.code === "stale_state")) throw e;
    });
    void finish(id).catch((e) => console.error(`finish ${id} crashed:`, e));
  } else if (!["finishing", "reported", "report_failed"].includes(row.status)) {
    throw conflict("not_live", `Interview is ${row.status}; there is no call to end.`);
  }
  return toView(await load(id));
}

/** Replaces the browser's live lines with the provider's transcript of record, when it has one. */
async function reconcile(id: string, sessionId: string): Promise<void> {
  const turns = await voice.transcript(sessionId);
  if (!turns.length) return;
  await prisma.$transaction([
    prisma.line.deleteMany({ where: { interviewId: id, origin: "provider" } }),
    prisma.line.createMany({
      data: turns.map((t, seq) => ({ interviewId: id, origin: "provider", seq, speaker: t.speaker, text: t.text, at: t.at })),
    }),
  ]);
}

async function finish(id: string): Promise<void> {
  const row = await load(id);
  if (row.status !== "finishing") return;

  if (row.providerSessionId) {
    await voice.end(row.providerSessionId).catch((e) => console.warn(`end session ${id}:`, reason(e)));
    // If this fails, the live lines from the browser are still there to score.
    await reconcile(id, row.providerSessionId).catch((e) => console.warn(`reconcile ${id}:`, reason(e)));
  }

  try {
    const lines = await transcript(id);
    if (!lines.some((l) => l.speaker === "candidate")) {
      await move(id, "finishing", "report_failed", {
        failure: { stage: "report", reason: "No answers were recorded during the call." } satisfies Failure,
      });
      return;
    }
    const report = await scoreInterview({ plan: Plan.parse(row.plan), lines });
    await move(id, "finishing", "reported", { report });
  } catch (error) {
    console.error(`score ${id} failed:`, error);
    await move(id, "finishing", "report_failed", {
      failure: { stage: "report", reason: reason(error) } satisfies Failure,
    }).catch(() => {});
  }
}

/* ---------- Reads, with recovery for work that died with the process ---------- */

async function recoverIfStale(row: Interview): Promise<void> {
  const now = Date.now();
  const idle = now - row.updatedAt.getTime();

  if (row.status === "preparing" && idle > STALE_PREPARE_MS) {
    await move(row.id, "preparing", "failed", {
      failure: { stage: "prepare", reason: "Preparing took too long. Please try again." } satisfies Failure,
    }).catch(() => {});
  } else if (row.status === "live" && row.startedAt && now - row.startedAt.getTime() > MAX_LIVE_MS) {
    await endInterview(row.id).catch(() => {});
  } else if (row.status === "finishing" && idle > STALE_FINISH_MS) {
    await move(row.id, "finishing", "report_failed", {
      failure: { stage: "report", reason: "Scoring took too long. Your transcript is saved." } satisfies Failure,
    }).catch(() => {});
  }
}

export async function getInterview(id: string) {
  await recoverIfStale(await load(id));
  return toView(await load(id));
}

export async function listInterviews(candidateId: string): Promise<InterviewSummary[]> {
  const rows = await prisma.interview.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status as InterviewStatus,
    role: r.role as Role,
    repo: r.repo,
    createdAt: r.createdAt.toISOString(),
    startedAt: r.startedAt?.toISOString() ?? null,
    endedAt: r.endedAt?.toISOString() ?? null,
    scores: r.report ? Report.parse(r.report).scores.map(({ dimension, score }) => ({ dimension, score })) : null,
  }));
}
