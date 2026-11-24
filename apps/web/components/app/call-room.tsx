"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { Halftone } from "@/components/halftone";
import { Waveform } from "@/components/landing/waveform";
import { LogoMark } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { report } from "@/lib/mock";
import { cn } from "@/lib/utils";

/*
 * Demo of the live call. A script stands in for Fish Agents events:
 * each line arrives like a final SDK `message`, and the page would POST it to /lines.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const LIMIT = 360;
const STEP_MS = 3800;

const QUESTIONS = report.questions;
const SCRIPT = report.transcript;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

type Phase = "live" | "scoring" | "done";

export function CallRoom({ id, title, role }: { id: string; title: string; role: string }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("live");
  const [elapsed, setElapsed] = useState(0);
  const [shown, setShown] = useState(1);
  const [muted, setMuted] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  const lines = SCRIPT.slice(0, shown);
  const last = lines.at(-1)!;
  const speaking = last.who === "interviewer" ? "interviewer" : "candidate";
  const askedCount = QUESTIONS.filter((q) => lines.some((l) => l.text === q.ask)).length;
  const current = QUESTIONS[Math.max(0, askedCount - 1)]!;

  useEffect(() => {
    if (phase !== "live") return;
    const tick = setInterval(() => setElapsed((s) => Math.min(LIMIT, s + 1)), 1000);
    return () => clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    if (phase !== "live") return;
    if (shown >= SCRIPT.length) {
      const id = setTimeout(() => setPhase("scoring"), 2500);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShown((n) => n + 1), reduce ? 1200 : STEP_MS);
    return () => clearTimeout(id);
  }, [phase, shown, reduce]);

  useEffect(() => {
    if (phase !== "scoring") return;
    const id = setTimeout(() => setPhase("done"), 2600);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [shown, reduce]);

  const warn = elapsed >= 270;

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <LogoMark />
          </Link>
          <span className="h-4 w-px bg-black/10" />
          <p className="truncate font-mono text-[0.75rem]">
            {title} <span className="text-muted-foreground">· {role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_24rem]">
        {/* Stage */}
        <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden px-4 py-8">
          <Halftone
            variant="voice"
            cell={7}
            className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_55%_at_50%_45%,black,transparent)]"
          />

          <div className="relative flex flex-col items-center">
            <div className="relative grid size-32 place-items-center sm:size-40">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-foreground/[0.06]"
                animate={
                  reduce || phase !== "live" ? { scale: 1 } : { scale: speaking === "interviewer" ? [1, 1.12, 1] : 1 }
                }
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative grid size-24 place-items-center rounded-full bg-foreground text-background shadow-[0_20px_50px_-20px_oklch(0_0_0/50%)] sm:size-28">
                {phase === "live" ? (
                  <Waveform bars={14} className="h-8 [&>span]:bg-white" />
                ) : (
                  <Check className="size-7" />
                )}
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={phase === "live" ? speaking : phase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-5 font-mono text-[0.75rem] text-muted-foreground"
              >
                {phase !== "live"
                  ? "Call ended"
                  : speaking === "interviewer"
                    ? "Interviewer is speaking"
                    : muted
                      ? "You are muted"
                      : "Listening to you"}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Current question */}
          <div className="glass relative mt-8 w-full max-w-xl rounded-2xl p-1.5">
            <div className="rounded-[12px] bg-white/75 p-4 sm:p-5">
              <div className="flex items-center justify-between font-mono text-[0.6875rem] text-muted-foreground">
                <span>
                  Question {Math.max(1, askedCount)} of {QUESTIONS.length}
                </span>
                <span className="flex gap-1">
                  {QUESTIONS.map((q, i) => (
                    <span
                      key={q.id}
                      className={cn(
                        "h-1 w-5 rounded-full transition-colors duration-500",
                        i < askedCount ? "bg-foreground" : "bg-black/10",
                      )}
                    />
                  ))}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease }}
                >
                  <p className="mt-3 text-[1rem] leading-snug font-medium tracking-[-0.01em] sm:text-[1.0625rem]">
                    {askedCount === 0 ? "Getting started…" : current.ask}
                  </p>
                  {askedCount > 0 && (
                    <span className="mt-2.5 inline-flex rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 font-mono text-[0.625rem] text-foreground/70">
                      {current.cite}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="relative mt-8 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              aria-pressed={muted}
              aria-label={muted ? "Unmute" : "Mute"}
              disabled={phase !== "live"}
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
            <Button
              className="h-11 bg-destructive px-5 hover:bg-destructive/90"
              disabled={phase !== "live"}
              onClick={() => setPhase("scoring")}
            >
              <PhoneOff className="size-4" /> End interview
            </Button>
          </div>
          {warn && phase === "live" && (
            <p className="relative mt-3 font-mono text-[0.6875rem] text-destructive">
              About a minute left. The call ends at 6:00.
            </p>
          )}
        </section>

        {/* Live transcript */}
        <aside className="flex min-h-0 flex-col border-t border-black/[0.06] bg-[oklch(0.985_0_0)] lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-[0.8125rem] font-medium">Live transcript</h2>
            <span className="font-mono text-[0.625rem] text-muted-foreground">Saved as you talk</span>
          </div>
          <ol ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 max-lg:max-h-64">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.at}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.45, ease }}
                  className={cn("flex flex-col", l.who === "candidate" ? "items-end" : "items-start")}
                >
                  <span className="mb-1 font-mono text-[0.5625rem] text-muted-foreground uppercase">
                    {l.who === "interviewer" ? "Interviewer" : "You"} · {l.at}
                  </span>
                  <span
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3.5 py-2 text-[0.8125rem] leading-relaxed",
                      l.who === "interviewer"
                        ? "rounded-tl-md border border-black/[0.07] bg-white"
                        : "rounded-tr-md bg-foreground text-background",
                    )}
                  >
                    {l.text}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </aside>
      </div>

      {/* End overlay */}
      <AnimatePresence>
        {phase !== "live" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 grid place-items-center bg-white/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="glass w-full max-w-sm rounded-2xl p-1.5"
              role="status"
            >
              <div className="rounded-[12px] bg-white p-6 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-foreground text-background">
                  {phase === "scoring" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                </span>
                <h2 className="mt-4 text-[1.0625rem] font-medium tracking-[-0.02em]">
                  {phase === "scoring" ? "Scoring your answers" : "Your report is ready"}
                </h2>
                <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                  {phase === "scoring"
                    ? `${lines.length} lines saved · ${fmt(elapsed)} on the call`
                    : "Five scores, each with a quote and the gap"}
                </p>
                {phase === "done" && (
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
