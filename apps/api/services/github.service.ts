import { parseGithubLogin, type GithubProfile, type GithubRepo } from "@repo/contracts";
import * as github from "../lib/github";
import { badRequest } from "../lib/http-error";

/* Profile + repos for a GitHub user, in our own shape. */
export async function loadGithubProfile(input: string): Promise<GithubProfile> {
  const login = parseGithubLogin(input);
  if (!login) throw badRequest("invalid_github", "Enter a GitHub username or profile URL.");

  const [user, repos] = await Promise.all([github.getUser(login), github.listRepos(login)]);

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog || null,
    publicRepos: user.public_repos,
    followers: user.followers,
    createdAt: user.created_at,
    url: user.html_url,
    repos: repos
      .filter((r) => !r.archived)
      .map(
        (r): GithubRepo => ({
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          topics: r.topics ?? [],
          isFork: r.fork,
          pushedAt: r.pushed_at,
          defaultBranch: r.default_branch,
          url: r.html_url,
        }),
      ),
    fetchedAt: new Date().toISOString(),
  };
}

/* The repo to interview on: the one asked for, else the most recently pushed non-fork. */
export function pickRepo(profile: GithubProfile, wanted?: string): GithubRepo {
  const own = profile.repos.filter((r) => !r.isFork);
  if (wanted) {
    const name = wanted.includes("/") ? wanted.split("/")[1] : wanted;
    const repo = profile.repos.find((r) => r.name.toLowerCase() === name?.toLowerCase());
    if (!repo) throw badRequest("unknown_repo", `"${wanted}" is not one of @${profile.login}'s public repos.`);
    return repo;
  }
  const repo = [...own].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
  if (!repo) throw badRequest("no_repos", `@${profile.login} has no public repos of their own.`);
  return repo;
}

/* ---------- Repo material for the fact sheet ---------- */

const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|py|go|rs|java|kt|rb|php|cs|swift|c|cc|cpp|h|scala|ex|sql|vue|svelte)$/i;
const SKIP = /(^|\/)(node_modules|vendor|dist|build|out|\.next|coverage|__tests__|tests?|spec|fixtures|migrations|generated)\//i;
const SKIP_FILE = /(\.test\.|\.spec\.|\.d\.ts$|\.min\.|\.config\.|lock)/i;
const PREFERRED_DIR = /^(src|app|lib|server|api|cmd|internal|pkg|core)\//i;
const ENTRY = /(^|\/)(index|main|app|server|handler|router|routes|service|worker)\.[a-z]+$/i;

const MAX_FILES = 3;
const FILE_CHARS = 4_000;

function scoreFile(path: string, size: number): number {
  let score = 0;
  if (PREFERRED_DIR.test(path)) score += 3;
  if (ENTRY.test(path)) score += 2;
  score -= path.split("/").length * 0.3; // shallower first
  score += Math.min(size, 20_000) / 10_000; // some substance
  return score;
}

export type RepoMaterial = {
  readme: string | null;
  languages: string[];
  files: { path: string; excerpt: string }[];
};

export async function loadRepoMaterial(repo: GithubRepo): Promise<RepoMaterial> {
  const [readme, languages, tree] = await Promise.all([
    github.getReadme(repo.fullName),
    github.getLanguages(repo.fullName),
    github.getTree(repo.fullName, repo.defaultBranch),
  ]);

  const candidates = tree
    .filter((e) => e.type === "blob" && e.size !== undefined && e.size > 300 && e.size < 60_000)
    .filter((e) => CODE_EXT.test(e.path) && !SKIP.test(e.path) && !SKIP_FILE.test(e.path))
    .sort((a, b) => scoreFile(b.path, b.size ?? 0) - scoreFile(a.path, a.size ?? 0))
    .slice(0, MAX_FILES);

  const files = await Promise.all(
    candidates.map(async (e) => {
      const text = await github.getFile(repo.fullName, e.path);
      return text ? { path: e.path, excerpt: text.slice(0, FILE_CHARS) } : null;
    }),
  );

  return {
    readme,
    languages: Object.keys(languages),
    files: files.filter((f) => f !== null),
  };
}
