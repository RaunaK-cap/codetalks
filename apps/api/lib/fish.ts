import { z } from "zod";
import { env } from "./env";
import { HttpError, upstream } from "./http-error";

/*
 * Fish Audio Agents REST API (https://docs.fish.audio/agents).
 * The API key never leaves the server; the browser only gets the session token.
 */

const BASE = "https://api.fish.audio/v1/agent";

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.FISH_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (res.ok) return res;

  const body = await res.text().catch(() => "");
  if (res.status === 402) throw new HttpError(503, "voice_quota", "Voice credit is used up. Try again later.");
  if (res.status === 409) throw upstream("voice_agent_unpublished", "The Fish agent has no published version.");
  if (res.status === 429) throw new HttpError(429, "voice_busy", "All voice lines are busy. Try again in a minute.");
  throw upstream("voice_error", `Fish ${init.method ?? "GET"} ${path} returned ${res.status}: ${body.slice(0, 300)}`);
}

/* Opaque to us: forwarded to the browser unchanged, which passes it to AgentSession.start(). */
export const SessionToken = z.looseObject({
  session_id: z.string(),
  token: z.string(),
  livekit_url: z.string(),
  expires_at: z.string(),
  max_duration_seconds: z.number().optional(),
});
export type SessionToken = z.infer<typeof SessionToken>;

export async function createSession(input: {
  name: string;
  endUserId: string;
  systemPrompt: string;
  firstMessage: string;
  metadata: Record<string, string>;
}): Promise<SessionToken> {
  const res = await call("/sessions", {
    method: "POST",
    body: JSON.stringify({
      agent_id: env.FISH_AGENT_ID,
      name: input.name.slice(0, 128),
      end_user_id: input.endUserId,
      metadata: input.metadata,
      overrides: { system_prompt: input.systemPrompt, first_message: input.firstMessage },
    }),
  });
  return SessionToken.parse(await res.json());
}

export async function endSession(sessionId: string): Promise<void> {
  try {
    await call(`/sessions/${encodeURIComponent(sessionId)}/end`, { method: "POST" });
  } catch (error) {
    // Ending a session that already ended is fine; anything else is not.
    if (!(error instanceof HttpError && error.code === "voice_error")) throw error;
  }
}

const HistoryItem = z.union([
  z.object({
    type: z.literal("message"),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    turn_id: z.number().optional(),
    created_at: z.string(),
  }),
  // tool_call, tool_result, transfer, and future item types are ignored.
  z.object({ type: z.string() }).transform(() => null),
]);

const Session = z.object({
  status: z.string(),
  end_reason: z.string().nullable().optional(),
  items: z.array(HistoryItem).default([]),
});

export type HistoryMessage = { role: "user" | "assistant"; content: string; createdAt: Date };

export async function getHistory(sessionId: string): Promise<{ status: string; messages: HistoryMessage[] }> {
  const res = await call(`/sessions/${encodeURIComponent(sessionId)}`);
  const session = Session.parse(await res.json());
  const messages = session.items
    .filter((i) => i !== null)
    .map((i) => ({ role: i.role, content: i.content, createdAt: new Date(i.created_at) }));
  return { status: session.status, messages };
}
