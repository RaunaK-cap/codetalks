import { parseGithubLogin, type GithubProfile, type GithubRepo } from "@repo/contracts";
import * as github from "../lib/github";
import { badRequest } from "../lib/http-error";

/* Profile + repos for a GitHub user, in our own shape. */
export async function loadGithubProfile(input: string, token?: github.GhToken): Promise<GithubProfile> {
  const login = parseGithubLogin(input);
  if (!login) throw badRequest("invalid_github", "Enter a GitHub username or profile URL.");

  const [user, repos] = await Promise.all([github.getUser(login, token), github.listRepos(login, token)]);

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

export const LATEST_REPOS = 3;

/*
 * The repos an interview covers. With `wanted`, that one repo (a deep dive).
 * Without it, the latest few non-fork repos, so questions span the candidate's projects.
 */
export function pickRepos(profile: GithubProfile, wanted?: string): GithubRepo[] {
  if (wanted) {
    const name = wanted.includes("/") ? wanted.split("/")[1] : wanted;
    const repo = profile.repos.find((r) => r.name.toLowerCase() === name?.toLowerCase());
    if (!repo) throw badRequest("unknown_repo", `"${wanted}" is not one of @${profile.login}'s public repos.`);
    return [repo];
  }
  const own = profile.repos
    .filter((r) => !r.isFork)
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, LATEST_REPOS);
  if (!own.length) throw badRequest("no_repos", `@${profile.login} has no public repos of their own.`);
  return own;
}

/** Finds stored "owner/name" values again in a freshly read profile. */
export function reposByName(profile: GithubProfile, fullNames: string[]): GithubRepo[] {
  return fullNames.map((full) => {
    const repo = profile.repos.find((r) => r.fullName.toLowerCase() === full.toLowerCase());
    if (!repo) throw badRequest("unknown_repo", `${full} is no longer one of @${profile.login}'s public repos.`);
    return repo;
  });
}

/* ---------- Repo material for the fact sheet ---------- */

const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|py|go|rs|java|kt|rb|php|cs|swift|c|cc|cpp|h|scala|ex|sql|vue|svelte)$/i;
const SKIP = /(^|\/)(node_modules|vendor|dist|build|out|\.next|coverage|__tests__|tests?|spec|fixtures|migrations|generated)\//i;
const SKIP_FILE = /(\.test\.|\.spec\.|\.d\.ts$|\.min\.|\.config\.|lock)/i;
const PREFERRED_DIR = /^(src|app|lib|server|api|cmd|internal|pkg|core)\//i;
const ENTRY = /(^|\/)(index|main|app|server|handler|router|routes|service|worker)\.[a-z]+$/i;

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
  repo: GithubRepo;
  readme: string | null;
  languages: string[];
  files: { path: string; excerpt: string }[];
};

/** README and languages, plus the `codeFiles` most central source files (0 skips the file tree). */
export async function loadRepoMaterial(repo: GithubRepo, codeFiles: number, token?: github.GhToken): Promise<RepoMaterial> {
  const [readme, languages, tree] = await Promise.all([
    github.getReadme(repo.fullName, token),
    github.getLanguages(repo.fullName, token),
    codeFiles > 0 ? github.getTree(repo.fullName, repo.defaultBranch, token) : Promise.resolve([]),
  ]);

  const candidates = tree
    .filter((e) => e.type === "blob" && e.size !== undefined && e.size > 300 && e.size < 60_000)
    .filter((e) => CODE_EXT.test(e.path) && !SKIP.test(e.path) && !SKIP_FILE.test(e.path))
    .sort((a, b) => scoreFile(b.path, b.size ?? 0) - scoreFile(a.path, a.size ?? 0))
    .slice(0, codeFiles);

  const files = await Promise.all(
    candidates.map(async (e) => {
      const text = await github.getFile(repo.fullName, e.path, token);
      return text ? { path: e.path, excerpt: text.slice(0, FILE_CHARS) } : null;
    }),
  );

  return {
    repo,
    readme,
    languages: Object.keys(languages),
    files: files.filter((f) => f !== null),
  };
}
