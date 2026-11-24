import { GithubProfile, LinkedinProfile, type CandidateView } from "@repo/contracts";
import { notFound } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { loadGithubProfile } from "./github.service";
import { extractLinkedinProfile, type Screenshot } from "./linkedin.service";

type Row = { id: string; github: unknown; linkedin: unknown; updatedAt: Date };

export function toCandidateView(row: Row): CandidateView {
  return {
    id: row.id,
    github: GithubProfile.parse(row.github),
    linkedin: row.linkedin ? LinkedinProfile.parse(row.linkedin) : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* Reads the user from GitHub and saves (or refreshes) the candidate. */
export async function connectGithub(input: string): Promise<CandidateView> {
  const github = await loadGithubProfile(input);
  const row = await prisma.candidate.upsert({
    where: { githubLogin: github.login.toLowerCase() },
    create: { githubLogin: github.login.toLowerCase(), github },
    update: { github },
  });
  return toCandidateView(row);
}

export async function getCandidate(id: string): Promise<CandidateView> {
  const row = await prisma.candidate.findUnique({ where: { id } });
  if (!row) throw notFound("Candidate");
  return toCandidateView(row);
}

export async function attachLinkedin(id: string, screenshots: Screenshot[]): Promise<CandidateView> {
  await getCandidate(id);
  const linkedin = await extractLinkedinProfile(screenshots);
  const row = await prisma.candidate.update({ where: { id }, data: { linkedin } });
  return toCandidateView(row);
}
