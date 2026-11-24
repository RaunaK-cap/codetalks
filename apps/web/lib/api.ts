import type {
  ApiErrorBody,
  CandidateView,
  InterviewSummary,
  InterviewView,
  Line,
  Role,
  StartCallResponse,
} from "@repo/contracts";

/* Typed client for apps/api. Every non-2xx response becomes an ApiError with the server's message. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
  connectGithub: (github: string) => post<CandidateView>("/candidates", { github }),
  getCandidate: (id: string) => request<CandidateView>(`/candidates/${id}`),
  listInterviews: (candidateId: string) => request<InterviewSummary[]>(`/candidates/${candidateId}/interviews`),
  uploadLinkedin: (candidateId: string, files: File[]) => {
    const form = new FormData();
    for (const f of files) form.append("screenshots", f);
    return request<CandidateView>(`/candidates/${candidateId}/linkedin`, { method: "POST", body: form });
  },

  createInterview: (input: { candidateId: string; role: Role; repo?: string }) =>
    post<InterviewView>("/interviews", input),
  getInterview: (id: string) => request<InterviewView>(`/interviews/${id}`),
  startCall: (id: string) => post<StartCallResponse>(`/interviews/${id}/call`),
  appendLine: (id: string, line: Line) => post<void>(`/interviews/${id}/lines`, line),
  endInterview: (id: string) => post<InterviewView>(`/interviews/${id}/end`),
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
