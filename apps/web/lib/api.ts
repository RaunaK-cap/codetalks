import type {
  ApiErrorBody,
  CandidateView,
  InterviewSummary,
  InterviewView,
  Line,
  MeView,
  ProvidersView,
  Role,
  StartCallResponse,
} from "@repo/contracts";

/*
 * Typed client for apps/api. Calls go to /api on this origin; next.config.ts forwards them
 * to Express, so the Better Auth session cookie is sent automatically.
 * Every non-2xx response becomes an ApiError with the server's message.
 */

const BASE = "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: init.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "network", "Can't reach the API. Is it running?");
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(res.status, error?.code ?? "unknown", error?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  providers: () => request<ProvidersView>("/providers"),

  me: () => request<MeView>("/me"),
  connectGithub: (github: string) => post<CandidateView>("/me/github", { github }),
  listInterviews: () => request<InterviewSummary[]>("/me/interviews"),
  uploadLinkedin: (files: File[]) => {
    const form = new FormData();
    for (const f of files) form.append("screenshots", f);
    return request<CandidateView>("/me/linkedin", { method: "POST", body: form });
  },

  createInterview: (input: { role: Role; repo?: string }) =>
    post<InterviewView>("/interviews", input),
  getInterview: (id: string) => request<InterviewView>(`/interviews/${id}`),
  startCall: (id: string) => post<StartCallResponse>(`/interviews/${id}/call`),
  appendLine: (id: string, line: Line) => post<void>(`/interviews/${id}/lines`, line),
  endInterview: (id: string) => post<InterviewView>(`/interviews/${id}/end`),
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
