import { GithubProfile, LinkedinProfile, type CandidateView, type MeView } from "@repo/contracts";
import { getAuthenticatedLogin } from "../lib/github";
import { conflict, notFound } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { loadGithubProfile } from "./github.service";
import { extractLinkedinProfile, type Screenshot } from "./linkedin.service";

/* A user's interview profile. One candidate per user, created when GitHub is connected. */

type Row = { id: string; github: unknown; linkedin: unknown; updatedAt: Date };

export function toCandidateView(row: Row): CandidateView {
  return {
    id: row.id,
    github: GithubProfile.parse(row.github),
    linkedin: row.linkedin ? LinkedinProfile.parse(row.linkedin) : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The user's GitHub OAuth token, if they signed in with GitHub. */
export async function githubTokenOf(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

export async function candidateOf(userId: string) {
  const row = await prisma.candidate.findUnique({ where: { userId } });
  if (!row) throw notFound("GitHub profile");
  return row;
}

/** Reads a GitHub user and saves it as this user's profile (replacing any earlier one). */
export async function connectGithub(userId: string, input: string): Promise<CandidateView> {
  const github = await loadGithubProfile(input, await githubTokenOf(userId));
  const login = github.login.toLowerCase();

  const taken = await prisma.candidate.findUnique({ where: { githubLogin: login }, select: { userId: true } });
  if (taken && taken.userId !== userId) {
    throw conflict("github_taken", `@${github.login} is already connected to another account.`);
  }

  const row = await prisma.candidate.upsert({
    where: { userId },
    create: { userId, githubLogin: login, github },
    update: { githubLogin: login, github },
  });
  return toCandidateView(row);
}

/** GitHub sign-ins get their profile connected automatically, using their own token. */
async function autoConnect(userId: string): Promise<CandidateView | null> {
  const token = await githubTokenOf(userId);
  if (!token) return null;
  try {
    return await connectGithub(userId, await getAuthenticatedLogin(token));
  } catch (error) {
    console.warn(`auto-connect GitHub for ${userId} failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getMe(userId: string): Promise<MeView> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const row = await prisma.candidate.findUnique({ where: { userId } });
  const hasGithubAccount = (await githubTokenOf(userId)) !== null;
  const candidate = row ? toCandidateView(row) : hasGithubAccount ? await autoConnect(userId) : null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.displayUsername ?? user.username,
      image: user.image,
    },
    candidate,
    hasGithubAccount,
  };
}

export async function attachLinkedin(userId: string, screenshots: Screenshot[]): Promise<CandidateView> {
  const candidate = await candidateOf(userId);
  const linkedin = await extractLinkedinProfile(screenshots);
  const row = await prisma.candidate.update({ where: { id: candidate.id }, data: { linkedin } });
  return toCandidateView(row);
}
