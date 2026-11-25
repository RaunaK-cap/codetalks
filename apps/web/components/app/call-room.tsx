"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AgentSession, type AgentMode } from "@fishaudio/agent-client";
import { ArrowRight, Check, Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import type { Line, Speaker } from "@repo/contracts";
import { Halftone } from "@/components/halftone";
import { VoiceOrbs, type Levels } from "@/components/app/voice-orbs";
import { LogoMark } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { ROLE_LABEL, reposTitle } from "@/lib/labels";
import { cn } from "@/lib/utils";

/*
 * The live call. Fish carries the audio (browser ↔ Fish over WebRTC).
 * This page only: starts the session with the API's token, saves each final line,
 * and asks the API to end and score.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const LIMIT = 300;
const WARN_AT = 240;
const AUTO_END_AT = 285; // end a little before Fish's 300s cap so the last answer is saved

type Phase = "lobby" | "connecting" | "live" | "ending" | "scoring" | "done" | "interrupted";

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function CallRoom({ id }: { id: string }) {
  const reduce = useReducedMotion();
  const { data: view, error: loadError, mutate } = useSWR(["interview", id], () => api.getInterview(id));

  const [phase, setPhase] = useState<Phase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AgentMode>("listening");
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<{ speaker: Speaker; text: string } | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [silent, setSilent] = useState(false);

  const session = useRef<AgentSession | null>(null);
  const seq = useRef(0);
  const ending = useRef(false);
  const listRef = useRef<HTMLOListElement>(null);

  // Where to start when the page loads, from the interview's server status.
  useEffect(() => {
    if (!view || phase !== null) return;
    if (view.status === "ready") setPhase("lobby");
    else if (view.status === "live") setPhase("interrupted"); // the session token is single-use, so a reload can't rejoin
    else if (view.status === "finishing") setPhase("scoring");
    else setPhase("done");
  }, [view, phase]);

  const readLevels = useCallback((): Levels | null => {
    const s = session.current;
    return s ? { ai: s.getOutputVolume(), you: s.getInputVolume() } : null;
  }, []);

  const saveLine = useCallback(
    (speaker: Speaker, text: string) => {
      const line = { seq: seq.current++, speaker, text };
      setLines((l) => [...l, line]);
      // One retry; the server ignores duplicates of the same seq.
      api.appendLine(id, line).catch(() => setTimeout(() => api.appendLine(id, line).catch(() => {}), 1500));
    },
    [id],
  );

  /** Ends the call on the API side and waits for scoring. Safe to call more than once. */
  const finish = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    setPhase("ending");
    await session.current?.end().catch(() => {});
    session.current = null;
    try {
      await api.endInterview(id);
      setPhase("scoring");
    } catch (e) {
      setError(errorMessage(e));
      setPhase("scoring");
    }
  }, [id]);

  const start = async () => {
    setError(null);
    setPhase("connecting");
    try {
      const { session: token, interview } = await api.startCall(id);
      mutate(interview, { revalidate: false });

      const s = await AgentSession.start({
        sessionToken: token,
        callbacks: {
          onMessage: (m) => {
            setInterim(null);
            if (m.text.trim()) saveLine(m.role === "user" ? "candidate" : "interviewer", m.text.trim());
          },
          onUserTranscript: (e) => {
            if (!e.final) setInterim({ speaker: "candidate", text: e.text });
          },
          onAgentResponseDelta: (e) => setInterim({ speaker: "interviewer", text: e.text }),
          onModeChange: setMode,
          onDisconnect: () => void finish(),
          onError: (e) => setError(e.message),
        },
      });
      session.current = s;
      await s.startAudio().catch(() => {});
      setStartedAt(interview.status === "live" && interview.startedAt ? Date.parse(interview.startedAt) : Date.now());
      setPhase("live");
    } catch (e) {
      setError(errorMessage(e));
      // If the API already marked it live, end it so it gets scored instead of hanging.
      const latest = await api.getInterview(id).catch(() => null);
      if (latest?.status === "live") void finish();
      else setPhase("lobby");
    }
  };

  // Clock, with a warning and an automatic end before Fish's hard cap.
  useEffect(() => {
    if (phase !== "live" || startedAt === null) return;
    const tick = () => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(Math.min(LIMIT, s));
      if (s >= AUTO_END_AT) void finish();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, startedAt, finish]);

  // Wait for the report.
  const { data: scored } = useSWR(phase === "scoring" ? ["interview-scoring", id] : null, () => api.getInterview(id), {
    refreshInterval: (latest) => (latest?.status === "finishing" || latest?.status === "live" ? 2000 : 0),
  });
  const reportReady = scored && (scored.status === "reported" || scored.status === "report_failed");

  // Hang up if the user navigates away mid-call.
  useEffect(() => () => void session.current?.end().catch(() => {}), []);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [lines, interim, reduce]);

  const toggleMute = async () => {
    const next = !muted;
    await session.current?.setMicMuted(next).catch(() => {});
    setMuted(next);
  };

  if (loadError) {
    return (
      <div className="grid h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-[0.9375rem] font-medium">{loadError.status === 404 ? "This interview doesn't exist." : errorMessage(loadError)}</p>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }
  if (!view || phase === null) {
    return (
      <div className="grid h-dvh place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = "plan" in view ? view.plan : null;
  const lastInterviewer = [...lines].reverse().find((l) => l.speaker === "interviewer")?.text ?? plan?.opener ?? "";
  const warn = phase === "live" && elapsed >= WARN_AT;
  const title = reposTitle(view.repos);

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <LogoMark />
          </Link>
          <span className="h-4 w-px bg-black/10" />
          <p className="truncate font-mono text-[0.75rem]">
            {title} <span className="text-muted-foreground">· {ROLE_LABEL[view.role]}</span>
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[0.6875rem] tabular-nums",
            warn ? "border-destructive/30 text-destructive" : "border-black/[0.08]",
          )}
        >
          {phase === "live" && (
            <span className="relative flex size-1.5">
              <span className="live-ping absolute inset-0 rounded-full bg-live" />
              <span className="relative size-1.5 rounded-full bg-live" />
            </span>
          )}
          {fmt(elapsed)} / {fmt(LIMIT)}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_24rem]">
        <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden px-4 py-8">
          <Halftone
            variant="voice"
            cell={7}
            className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_55%_at_50%_45%,black,transparent)]"
          />

          <div className="relative flex flex-col items-center">
            <VoiceOrbs
              readLevels={readLevels}
              live={phase === "live"}
              mode={mode}
              muted={muted}
              onSilenceChange={setSilent}
              aiCenter={
                phase === "connecting" || phase === "ending" ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : phase === "lobby" ? (
                  <Mic className="size-6" />
                ) : (
                  <Check className="size-6" />
                )
              }
            />
            {phase !== "live" && (
              <p className="mt-4 font-mono text-[0.75rem] text-muted-foreground" aria-live="polite">
                {phase === "lobby" && "Ready when you are"}
                {phase === "connecting" && "Connecting…"}
                {phase === "ending" && "Ending the call…"}
                {(phase === "scoring" || phase === "done" || phase === "interrupted") && "Call ended"}
              </p>
            )}
          </div>

          <div className="glass relative mt-8 w-full max-w-xl rounded-2xl p-1.5">
            <div className="rounded-[12px] bg-white/75 p-4 sm:p-5">
              {phase === "lobby" && plan ? (
                <>
                  <p className="font-mono text-[0.6875rem] text-muted-foreground">{plan.questions.length} questions · about 5 minutes</p>
                  <p className="mt-3 text-[1rem] leading-snug font-medium">
                    The interviewer will ask about {view.repos.length > 1 ? "your recent projects" : title}. Speak naturally; you can
                    pause and think.
                  </p>
                </>
              ) : phase === "interrupted" ? (
                <>
                  <p className="text-[1rem] font-medium">This call was interrupted.</p>
                  <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                    A dropped call can't be rejoined. End it now to get a report on what was said.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-[0.6875rem] text-muted-foreground">Interviewer</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={lastInterviewer}
                      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.45, ease }}
                      className="mt-2 text-[1rem] leading-snug font-medium tracking-[-0.01em] sm:text-[1.0625rem]"
                    >
                      {lastInterviewer || "…"}
                    </motion.p>
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            {phase === "lobby" && (
              <Button className="h-11 px-6" onClick={start}>
                <Mic className="size-4" /> Start the call
              </Button>
            )}
            {phase === "interrupted" && (
              <Button className="h-11 px-6" onClick={() => void finish()}>
                End and get my report
              </Button>
            )}
            {(phase === "live" || phase === "connecting") && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-pressed={muted}
                  aria-label={muted ? "Unmute" : "Mute"}
                  disabled={phase !== "live"}
                  onClick={toggleMute}
                >
                  {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <Button className="h-11 bg-destructive px-5 hover:bg-destructive/90" disabled={phase !== "live"} onClick={() => void finish()}>
                  <PhoneOff className="size-4" /> End interview
                </Button>
              </>
            )}
            {phase === "done" && (
              <Link href={`/interviews/${id}`} className={buttonVariants({ className: "h-11 px-6" })}>
                See the report <ArrowRight />
              </Link>
            )}
          </div>
          {warn && <p className="relative mt-3 font-mono text-[0.6875rem] text-destructive">About a minute left. The call ends at 4:45.</p>}
          {phase === "live" && silent && !muted && (
            <p role="alert" className="relative mt-3 font-mono text-[0.6875rem] text-destructive">
              We can't hear you. Check that the right microphone is selected and not muted.
            </p>
          )}
          {error && (
            <p role="alert" className="relative mt-3 max-w-md text-center font-mono text-[0.6875rem] text-destructive">
              {error}
            </p>
          )}
        </section>

        <aside className="flex min-h-0 flex-col border-t border-black/[0.06] bg-[oklch(0.985_0_0)] lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-[0.8125rem] font-medium">Live transcript</h2>
            <span className="font-mono text-[0.625rem] text-muted-foreground">Saved as you talk</span>
          </div>
          <ol ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 max-lg:max-h-64">
            {lines.length === 0 && !interim && (
              <li className="font-mono text-[0.6875rem] text-muted-foreground">
                {phase === "lobby" ? "The transcript appears here once the call starts." : "Nothing said yet."}
              </li>
            )}
            {[...lines, ...(interim ? [{ seq: -1, ...interim }] : [])].map((l) => (
              <motion.li
                key={l.seq}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: l.seq === -1 ? 0.6 : 1, y: 0 }}
                transition={{ duration: 0.35, ease }}
                className={cn("flex flex-col", l.speaker === "candidate" ? "items-end" : "items-start")}
              >
                <span className="mb-1 font-mono text-[0.5625rem] text-muted-foreground uppercase">
                  {l.speaker === "interviewer" ? "Interviewer" : "You"}
                </span>
                <span
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3.5 py-2 text-[0.8125rem] leading-relaxed",
                    l.speaker === "interviewer"
                      ? "rounded-tl-md border border-black/[0.07] bg-white"
                      : "rounded-tr-md bg-foreground text-background",
                  )}
                >
                  {l.text}
                </span>
              </motion.li>
            ))}
          </ol>
        </aside>
      </div>

      <AnimatePresence>
        {phase === "scoring" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-white/60 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="glass w-full max-w-sm rounded-2xl p-1.5"
              role="status"
            >
              <div className="rounded-[12px] bg-white p-6 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-foreground text-background">
                  {reportReady ? <Check className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
                </span>
                <h2 className="mt-4 text-[1.0625rem] font-medium tracking-[-0.02em]">
                  {!reportReady ? "Scoring your answers" : scored.status === "reported" ? "Your report is ready" : "We couldn't score this one"}
                </h2>
                <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                  {!reportReady
                    ? `${lines.length} lines saved · ${fmt(elapsed)} on the call`
                    : scored.status === "reported"
                      ? "Five scores, each with a quote and the gap"
                      : "Your transcript is saved"}
                </p>
                {reportReady && (
                  <Link href={`/interviews/${id}`} className={buttonVariants({ className: "mt-5 w-full" })}>
                    Open report <ArrowRight />
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
