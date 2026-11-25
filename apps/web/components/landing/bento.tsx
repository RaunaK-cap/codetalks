"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, FileSearch, Lock, MessageSquareText, Mic, ScanText, Timer, ChartColumn } from "lucide-react";
import { Waveform } from "@/components/landing/waveform";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/* Runs a step counter only while the tile is on screen. */
function useLoop(count: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-40px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? count - 1 : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => setStep((s) => (s + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms, inView, reduce]);

  return { ref, step: reduce ? count - 1 : step, inView };
}

function Tile({
  icon,
  title,
  body,
  children,
  className,
  id,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.article
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease }}
      className={cn(
        "group flex flex-col rounded-[18px] border border-foreground/[0.07] bg-card p-1.5 shadow-[0_1px_2px_oklch(0_0_0/4%)]",
        className,
      )}
    >
      <div className="relative h-[196px] overflow-hidden rounded-[13px] border border-foreground/[0.05] bg-muted transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
        {children}
      </div>
      <div className="flex gap-3 p-3.5 pt-4">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-foreground/[0.08] bg-card text-foreground/80 [&_svg]:size-3.5">
          {icon}
        </span>
        <div>
          <h3 className="text-[0.875rem] font-medium tracking-[-0.01em] text-foreground">{title}</h3>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </motion.article>
  );
}

/* 1. Repo scan: a highlight walks the file and stops on the line that becomes a question. */
const CODE = [
  "export async function sync(store) {",
  "  const since = await store.cursor()",
  "  const rows = await api.changes(since)",
  "  await store.apply(rows)",
  "}",
  "",
  "setInterval(() => sync(db), 5000)",
  "export const REALTIME = true",
];
const STOPS = [1, 2, 3, 6];

function RepoScan() {
  const { ref, step } = useLoop(STOPS.length, 1300);
  const line = STOPS[step]!;
  const flagged = line === 6;
  return (
    <div ref={ref} className="absolute inset-0 p-4">
      <div className="flex items-center gap-2 font-mono text-[0.625rem] text-muted-foreground">
        <span className="rounded border border-foreground/8 bg-card px-1.5 py-0.5">src/sync.ts</span>
        <span>reading · 3 of 41 files</span>
      </div>
      <div className="relative mt-3 font-mono text-[0.6875rem] leading-[18px]">
        <motion.div
          aria-hidden
          className={cn(
            "absolute -inset-x-2 h-[18px] rounded-[5px] transition-colors duration-300",
            flagged ? "bg-live/12 ring-1 ring-live/30" : "bg-foreground/[0.05]",
          )}
          animate={{ y: line * 18 }}
          transition={{ duration: 0.55, ease }}
        />
        {CODE.map((l, i) => (
          <div key={i} className="relative flex gap-3 whitespace-pre text-foreground/75">
            <span className="w-4 text-right text-foreground/25 select-none">{i + 36}</span>
            <span>{l}</span>
          </div>
        ))}
        <AnimatePresence>
          {flagged && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="absolute right-0 rounded-full bg-foreground px-2 py-0.5 font-sans text-[0.625rem] text-background"
              style={{ top: 6 * 18 }}
            >
              Asked at 01:12
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* 2. Voice: live level bars and a running clock. */
function Voice() {
  const { ref, step } = useLoop(2, 2600);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-5">
      <div className="relative grid size-14 place-items-center rounded-full bg-foreground text-background">
        <span className="live-ping absolute inset-0 rounded-full bg-foreground/30" />
        <Mic className="relative size-5" />
      </div>
      <Waveform bars={26} className="h-8" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-[0.6875rem] text-muted-foreground"
        >
          {step === 0 ? "Interviewer is speaking" : "Listening to you"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* 3. Claim check: the README claim gets struck, the evidence appears. */
function ClaimCheck() {
  const { ref, step } = useLoop(3, 1500);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-3 p-5">
      <div className="rounded-xl border border-foreground/8 bg-card p-3">
        <p className="font-mono text-[0.625rem] text-muted-foreground">README.md</p>
        <p className="relative mt-1 inline-block text-[0.8125rem] font-medium text-foreground">
          “Real-time sync across devices”
          <motion.span
            aria-hidden
            className="absolute top-1/2 left-0 h-[1.5px] w-full origin-left bg-foreground"
            animate={{ scaleX: step >= 1 ? 1 : 0 }}
            transition={{ duration: 0.6, ease }}
          />
        </p>
      </div>
      <motion.div
        animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 6 }}
        transition={{ duration: 0.45, ease }}
        className="rounded-xl border border-live/25 bg-live/[0.06] p-3"
      >
        <p className="font-mono text-[0.625rem] text-live">sync.ts · L42</p>
        <p className="mt-1 text-[0.8125rem] text-foreground">Polls every 5 seconds.</p>
      </motion.div>
    </div>
  );
}

/* 4. Live transcript: lines arrive one by one. */
const LINES = [
  { who: "AI", t: "00:14", text: "Walk me through ledger-sync." },
  { who: "You", t: "00:31", text: "It pulls bank ledgers into Postgres." },
  { who: "AI", t: "01:12", text: "Why three retries?" },
  { who: "You", t: "01:20", text: "Only 5xx and timeouts retry." },
];

function Transcript() {
  const { ref, step } = useLoop(LINES.length + 1, 1100);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-end gap-1.5 p-4">
      <AnimatePresence initial={false}>
        {LINES.slice(0, Math.max(1, step)).map((l) => (
          <motion.div
            key={l.t}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className={cn(
              "max-w-[88%] rounded-xl px-3 py-1.5 text-[0.75rem]",
              l.who === "AI"
                ? "self-start border border-foreground/8 bg-card text-foreground"
                : "self-end bg-foreground text-background",
            )}
          >
            <span className="mr-1.5 font-mono text-[0.5625rem] opacity-50">{l.t}</span>
            {l.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* 5. Five minutes: the plan, with a ring that tracks the current segment. */
const PLAN = ["Warm-up", "Your claim", "Your code", "Design", "Wrap"];

function Clock() {
  const { ref, step } = useLoop(PLAN.length, 1400);
  const progress = (step + 1) / PLAN.length;
  const C = 2 * Math.PI * 30;
  return (
    <div ref={ref} className="absolute inset-0 flex items-center gap-5 p-5">
      <div className="relative size-[76px] shrink-0">
        <svg viewBox="0 0 72 72" className="size-full -rotate-90">
          <circle cx="36" cy="36" r="30" fill="none" stroke="oklch(0 0 0 / 8%)" strokeWidth="5" />
          <motion.circle
            cx="36"
            cy="36"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ duration: 0.8, ease }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-[0.6875rem] tabular-nums">
          {Math.round(progress * 5)}:00
        </span>
      </div>
      <ul className="space-y-1 font-mono text-[0.6875rem]">
        {PLAN.map((p, i) => (
          <li
            key={p}
            className={cn(
              "flex items-center gap-2 transition-colors duration-300",
              i === step ? "text-foreground" : i < step ? "text-foreground/35" : "text-foreground/25",
            )}
          >
            <span
              className={cn(
                "size-1 rounded-full transition-colors",
                i === step ? "bg-live" : "bg-current",
              )}
            />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 6. Report: five scores fill, each with a quote. */
const SCORES = [
  { name: "Depth", v: 4 },
  { name: "Correctness", v: 3 },
  { name: "Ownership", v: 2 },
  { name: "Communication", v: 4 },
  { name: "Tradeoffs", v: 3 },
];

function Report() {
  const { ref, inView } = useLoop(1, 1000);
  return (
    <div ref={ref} className="absolute inset-0 grid grid-cols-[1fr_auto] gap-4 p-5">
      <ul className="space-y-2.5 self-center">
        {SCORES.map((s, i) => (
          <li key={s.name} className="grid grid-cols-[6.5rem_1fr_1.5rem] items-center gap-3">
            <span className="font-mono text-[0.6875rem] text-muted-foreground">{s.name}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              <motion.span
                className="block h-full origin-left rounded-full bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: inView ? s.v / 5 : 0 }}
                transition={{ duration: 0.9, ease, delay: 0.15 + i * 0.08 }}
              />
            </span>
            <span className="font-mono text-[0.6875rem] tabular-nums">{s.v}/5</span>
          </li>
        ))}
      </ul>
      <div className="hidden w-44 self-center rounded-xl border border-foreground/8 bg-card p-3 sm:block">
        <p className="font-mono text-[0.625rem] text-muted-foreground">Ownership · gap</p>
        <p className="mt-1 text-[0.75rem] leading-snug text-foreground">
          Resume says “led”. The answer said “the team decided, I think”.
        </p>
      </div>
    </div>
  );
}

/* 7. Privacy: checks tick in one by one. */
const PRIVATE = [
  "Resume parsed in memory, the file is never stored",
  "Public repos only, read-only access",
  "Delete any interview and its transcript",
];

function Private() {
  const { ref, step } = useLoop(PRIVATE.length + 2, 900);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-2 p-5">
      {PRIVATE.map((p, i) => {
        const on = step > i;
        return (
          <div
            key={p}
            className="flex items-center gap-2.5 rounded-xl border border-foreground/8 bg-card px-3 py-2"
          >
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full transition-colors duration-300",
                on ? "bg-foreground text-background" : "border border-foreground/15 text-transparent",
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            <span className="text-[0.75rem] text-foreground/80">{p}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Bento() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
      <Tile
        className="lg:col-span-4"
        icon={<FileSearch />}
        title="Reads your repo"
        body="It walks your files and picks the lines worth asking about."
      >
        <RepoScan />
      </Tile>
      <Tile
        className="lg:col-span-2"
        icon={<Mic />}
        title="Real voice, in the browser"
        body="No app to install. Talk like you would on a real call."
      >
        <Voice />
      </Tile>
      <Tile
        className="lg:col-span-2"
        icon={<ScanText />}
        title="Claim check"
        body="Bold claims in your README or resume get tested against the code."
      >
        <ClaimCheck />
      </Tile>
      <Tile
        className="lg:col-span-2"
        icon={<MessageSquareText />}
        title="Live transcript"
        body="Every turn is saved as it happens, with timestamps."
      >
        <Transcript />
      </Tile>
      <Tile
        className="lg:col-span-2"
        icon={<Timer />}
        title="Five focused minutes"
        body="A plan built for you, paced like a real screen."
      >
        <Clock />
      </Tile>
      <Tile
        id="report"
        className="lg:col-span-3"
        icon={<ChartColumn />}
        title="A report with receipts"
        body="Five scores, each tied to a quote and the gap in your answer."
      >
        <Report />
      </Tile>
      <Tile
        className="md:col-span-2 lg:col-span-3"
        icon={<Lock />}
        title="Private by default"
        body="Your sources stay on our server and only feed your interview."
      >
        <Private />
      </Tile>
    </div>
  );
}
