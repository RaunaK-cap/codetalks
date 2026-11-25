"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import type { AgentMode } from "@fishaudio/agent-client";
import { cn } from "@/lib/utils";

/*
 * Two orbs, interviewer and candidate, driven by real audio levels from the Fish session.
 * Levels are read every animation frame and written to CSS variables, so React never
 * re-renders per frame. The orb that is talking grows with its voice; the other dims.
 */

export type Levels = { ai: number; you: number };

const BARS = [0.55, 0.85, 1, 0.8, 0.5];
const HEARD = 0.04; // mic level that counts as "the candidate is making sound"
const SILENCE_MS = 8_000;

function Orb({
  label,
  status,
  tone,
  active,
  thinking,
  orbRef,
  center,
}: {
  label: string;
  status: string;
  tone: "dark" | "light";
  active: boolean;
  thinking?: boolean;
  orbRef: React.RefObject<HTMLDivElement | null>;
  center?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("flex flex-col items-center transition-opacity duration-500", active ? "opacity-100" : "opacity-55")}>
      <div
        ref={orbRef}
        style={{ "--lvl": 0 } as React.CSSProperties}
        className="relative grid size-28 place-items-center sm:size-36"
      >
        {/* Halo that swells with the voice */}
        <span
          aria-hidden
          className={cn("absolute inset-0 rounded-full", dark ? "bg-foreground/[0.07]" : "bg-live/[0.1]")}
          style={{ transform: "scale(calc(1 + var(--lvl) * 0.45))", transition: "transform 80ms linear" }}
        />
        {thinking && (
          <span
            aria-hidden
            className="absolute -inset-1 animate-spin rounded-full [animation-duration:2.4s] [background:conic-gradient(from_0deg,transparent_0deg,oklch(0_0_0/35%)_80deg,transparent_160deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-2px),black_calc(100%-2px))]"
          />
        )}
        <span
          className={cn(
            "relative grid size-20 place-items-center rounded-full sm:size-24",
            dark
              ? "bg-foreground text-background shadow-[0_20px_50px_-20px_oklch(0_0_0/50%)]"
              : "border border-black/10 bg-white text-foreground shadow-[0_12px_32px_-16px_oklch(0_0_0/25%)]",
          )}
          style={{ transform: "scale(calc(1 + var(--lvl) * 0.12))", transition: "transform 80ms linear" }}
        >
          {center ?? (
            <span aria-hidden className="flex h-7 items-center gap-[3px]">
              {BARS.map((weight, i) => (
                <span
                  key={i}
                  className={cn("w-[3px] rounded-full", dark ? "bg-white" : "bg-foreground")}
                  style={{
                    height: `calc(4px + var(--lvl) * ${Math.round(weight * 24)}px)`,
                    transition: "height 80ms linear",
                  }}
                />
              ))}
            </span>
          )}
        </span>
      </div>
      <p className="mt-3 text-[0.8125rem] font-medium">{label}</p>
      <p className="font-mono text-[0.6875rem] text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

export function VoiceOrbs({
  readLevels,
  live,
  mode,
  muted,
  aiCenter,
  onSilenceChange,
}: {
  /** Returns current 0..1 levels, or null when there is no session. */
  readLevels: () => Levels | null;
  live: boolean;
  mode: AgentMode;
  muted: boolean;
  /** Replaces the AI orb's bars when not live (spinner, mic, check). */
  aiCenter?: ReactNode;
  onSilenceChange?: (silent: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const aiRef = useRef<HTMLDivElement>(null);
  const youRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!live) {
      aiRef.current?.style.setProperty("--lvl", "0");
      youRef.current?.style.setProperty("--lvl", "0");
      return;
    }

    let frame = 0;
    let ai = 0;
    let you = 0;
    const startedAt = performance.now();
    let lastHeard = startedAt;
    let silent = false;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      const levels = readLevels();
      if (!levels) return;

      // sqrt lifts quiet speech so the motion is visible; lerp smooths jitter.
      const targetAi = Math.sqrt(Math.min(1, Math.max(0, levels.ai)));
      const targetYou = Math.sqrt(Math.min(1, Math.max(0, levels.you)));
      ai += (targetAi - ai) * 0.35;
      you += (targetYou - you) * 0.35;

      if (!reduce) {
        aiRef.current?.style.setProperty("--lvl", ai.toFixed(3));
        youRef.current?.style.setProperty("--lvl", you.toFixed(3));
      }

      const now = performance.now();
      if (levels.you > HEARD) lastHeard = now;
      const nowSilent = modeRef.current === "listening" && now - lastHeard > SILENCE_MS && now - startedAt > SILENCE_MS;
      if (nowSilent !== silent) {
        silent = nowSilent;
        onSilenceChange?.(silent);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [live, readLevels, reduce, onSilenceChange]);

  const aiStatus = !live ? "Interviewer" : mode === "speaking" ? "Speaking" : mode === "thinking" ? "Thinking…" : "Listening";
  const youStatus = !live ? "You" : muted ? "Muted" : mode === "listening" ? "Your turn" : "Waiting";

  return (
    <div className="flex items-start justify-center gap-8 sm:gap-16">
      <Orb
        label="Interviewer"
        status={aiStatus}
        tone="dark"
        active={!live || mode !== "listening"}
        thinking={live && mode === "thinking"}
        orbRef={aiRef}
        center={live ? undefined : aiCenter}
      />
      <Orb label="You" status={youStatus} tone="light" active={!live || mode === "listening"} orbRef={youRef} />
    </div>
  );
}
