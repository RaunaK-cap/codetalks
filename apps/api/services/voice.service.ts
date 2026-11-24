import type { Speaker } from "@repo/contracts";
import * as fish from "../lib/fish";

/*
 * The voice provider behind one interface, so Grok Voice can replace Fish later
 * without touching the interview service.
 */

export type StartVoiceInput = {
  interviewId: string;
  candidateId: string;
  title: string;
  systemPrompt: string;
  firstMessage: string;
};

export type VoiceTurn = { speaker: Speaker; text: string; at: Date };

export interface VoiceProvider {
  /** Creates the session. `clientToken` goes to the browser unchanged. */
  start(input: StartVoiceInput): Promise<{ sessionId: string; clientToken: unknown }>;
  end(sessionId: string): Promise<void>;
  /** Full transcript as recorded by the provider, oldest first. */
  transcript(sessionId: string): Promise<VoiceTurn[]>;
}

const fishVoice: VoiceProvider = {
  async start(input) {
    const token = await fish.createSession({
      name: input.title,
      endUserId: input.candidateId,
      systemPrompt: input.systemPrompt,
      firstMessage: input.firstMessage,
      metadata: { interviewId: input.interviewId },
    });
    return { sessionId: token.session_id, clientToken: token };
  },
  end: (sessionId) => fish.endSession(sessionId),
  async transcript(sessionId) {
    const { messages } = await fish.getHistory(sessionId);
    return messages.map((m) => ({
      speaker: m.role === "user" ? "candidate" : "interviewer",
      text: m.content,
      at: m.createdAt,
    }));
  },
};

export const voice: VoiceProvider = fishVoice;
