"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { Halftone } from "@/components/halftone";
import { buttonVariants } from "@/components/ui/button";
import { Waveform } from "@/components/landing/waveform";

const ease = [0.16, 1, 0.3, 1] as const;

const EXCHANGES = [
  {
    q: "Your README says real-time sync. sync.ts polls every five seconds. Which one is it?",
    cite: "sync.ts · L42",
    a: "Polling, honestly. Websockets were next on the list.",
  },
  {
    q: "Walk me through the retry in uploadFile. Why three attempts?",
    cite: "api/upload.ts · L88",
    a: "Three covered a slow minute without hammering S3.",
  },
  {
    q: "Your resume says you led the migration. What did you decide yourself?",
    cite: "resume.pdf · p1",
    a: "I picked Postgres and wrote the backfill script.",
  },
];

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function CallCard() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [seconds, setSeconds] = useState(108);

  useEffect(() => {
    if (reduce) return;
    const tick = setInterval(
      () => setSeconds((s) => (s >= 299 ? 0 : s + 1)),
      1000,
    );
    const swap = setInterval(
      () => setI((n) => (n + 1) % EXCHANGES.length),
      5200,
    );
    return () => {
      clearInterval(tick);
      clearInterval(swap);
    };
  }, [reduce]);

  const ex = EXCHANGES[i]!;

  return (
    <div className="glass w-[min(26rem,calc(100vw-3rem))] rounded-2xl p-1.5">
      <div className="rounded-[12px] bg-card/70 p-4">
        <div className="flex items-center justify-between font-mono text-[0.6875rem]">
          <span className="inline-flex items-center gap-2 text-foreground">
            <span className="relative flex size-1.5">
              <span className="live-ping absolute inset-0 rounded-full bg-live" />
              <span className="relative size-1.5 rounded-full bg-live" />
            </span>
            Live interview
          </span>
          <span className="text-muted-foreground tabular-nums">
            {fmt(seconds)} / 05:00
          </span>
        </div>

        <div className="relative mt-4 min-h-[8.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="font-mono text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                Interviewer
              </p>
              <p className="mt-1 text-[0.875rem] leading-snug font-medium text-foreground">
                {ex.q}
              </p>
              <span className="mt-2 inline-flex rounded-md border border-foreground/8 bg-card px-1.5 py-0.5 font-mono text-[0.625rem] text-foreground/70">
                {ex.cite}
              </span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="mt-3 border-l border-foreground/10 pl-2.5 text-[0.8125rem] text-muted-foreground"
              >
                <span className="font-mono text-[0.625rem] uppercase">
                  You ·{" "}
                </span>
                {ex.a}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-foreground/6 pt-3">
          <Waveform bars={32} className="h-6 flex-1" />
          <span className="font-mono text-[0.625rem] text-muted-foreground">
            Listening
          </span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const item = (d: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, ease, delay: d },
        };

  return (
    <>
      <section className="relative -mt-[3.75rem] overflow-hidden">
        {/* Background art, then two washes: a light tint for text, and a long fade into the white page. */}
        <div aria-hidden className="absolute inset-0">
          <Image
            src="/hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_100%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.45_0.12_250/22%),transparent_40%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklch,var(--background)_55%,transparent)_45%,color-mix(in_oklch,var(--background)_92%,transparent)_80%,var(--background))]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 pt-[8.5rem] text-center sm:pt-40">
          <motion.div {...item(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 font-mono text-[0.6875rem] text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-white" />
              Voice mock interviews
            </span>
          </motion.div>
          <motion.h1
            {...item(0.08)}
            className="mt-5 text-[2.25rem] leading-[1.05] font-medium tracking-[-0.04em] text-white [text-shadow:0_2px_24px_oklch(0.3_0.1_250/35%)] sm:text-[3.25rem]"
          >
            Get interviewed on the code
            <br className="hidden sm:block" /> you actually wrote.
          </motion.h1>
          <motion.p
            {...item(0.16)}
            className="mx-auto mt-4 max-w-md text-[0.875rem] leading-relaxed text-white/90 [text-shadow:0_1px_12px_oklch(0.3_0.1_250/40%)]"
          >
            CodeTalk reads your GitHub and resume, then runs a five-minute voice
            interview about your own files. You get a transcript and a report
            with receipts.
          </motion.p>
          <motion.div
            {...item(0.24)}
            className="mt-7 flex flex-wrap items-center justify-center gap-2"
          >
            <Link
              href="/auth?mode=signup"
              className={buttonVariants({ shape: "soft" })}
            >
              Start an interview
              <ArrowRight />
            </Link>
            <a
              href="#features"
              className={buttonVariants({
                variant: "outline",
                shape: "soft",
                className: "border-transparent",
              })}
            >
              <Play className="size-3" />
              See how it works
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.45 }}
          className="relative mt-16 grid place-items-center px-4 pb-28 sm:mt-24 sm:pb-36"
        >
          <CallCard />
        </motion.div>
      </section>

      {/* The dot wave now sits under the art, as the bridge into the page. */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease, delay: 0.6 }}
        className="relative -mt-16 h-[220px] sm:-mt-20 sm:h-[280px]"
      >
        <Halftone
          variant="voice"
          cell={7}
          className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
        />
      </motion.div>
    </>
  );
}
