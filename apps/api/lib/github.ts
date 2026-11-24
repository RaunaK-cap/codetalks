import { env } from "./env";
import { HttpError, notFound, upstream } from "./http-error";

/*
 * Thin client for the GitHub REST API. Public data only.
 * Without GITHUB_TOKEN the limit is 60 requests/hour for the whole server.
 */

const BASE = "https://api.github.com";

export type GhUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
  html_url: string;
};

export type GhRepo = {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  html_url: string;
  default_branch: string;
  size: number;
};

export type GhTreeEntry = { path: string; type: "blob" | "tree" | "commit"; size?: number };

function headers(accept = "application/vnd.github+json"): Record<string, string> {
  return {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "codetalk-api",
    ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
  };
}

async function request(path: string, accept?: string): Promise<Response | null> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(accept) });
  if (res.status === 404) return null;

  const remaining = res.headers.get("x-ratelimit-remaining");
  if ((res.status === 403 || res.status === 429) && remaining === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
    throw new HttpError(429, "github_rate_limited", `GitHub rate limit reached. Try again in ${minutes} min.`);
  }
  if (!res.ok) throw upstream("github_error", `GitHub returned ${res.status} for ${path}`);
  return res;
}

async function json<T>(path: string): Promise<T | null> {
  const res = await request(path);
  return res ? ((await res.json()) as T) : null;
}

async function raw(path: string): Promise<string | null> {
  const res = await request(path, "application/vnd.github.raw+json");
  return res ? res.text() : null;
}

export async function getUser(login: string): Promise<GhUser> {
  const user = await json<GhUser>(`/users/${encodeURIComponent(login)}`);
  if (!user) throw notFound(`GitHub user "${login}"`);
  return user;
}

export async function listRepos(login: string): Promise<GhRepo[]> {
  const repos = await json<GhRepo[]>(
    `/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100`,
  );
  return repos ?? [];
}

export async function getReadme(fullName: string): Promise<string | null> {
  return raw(`/repos/${fullName}/readme`);
}

export async function getLanguages(fullName: string): Promise<Record<string, number>> {
  return (await json<Record<string, number>>(`/repos/${fullName}/languages`)) ?? {};
}

export async function getTree(fullName: string, branch: string): Promise<GhTreeEntry[]> {
  const tree = await json<{ tree: GhTreeEntry[] }>(
    `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  return tree?.tree ?? [];
}

export async function getFile(fullName: string, path: string): Promise<string | null> {
  return raw(`/repos/${fullName}/contents/${path.split("/").map(encodeURIComponent).join("/")}`);
}
