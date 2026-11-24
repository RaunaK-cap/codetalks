"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { SectionLabel } from "@/components/landing/reveal";

const TEXT =
  "Most mock interviews ask everyone the same questions. CodeTalk reads what you built, then asks you to defend it out loud, the way a sharp senior engineer would.";

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const opacity = useTransform(progress, [start, start + 1 / total], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {word}{" "}
    </motion.span>
  );
}

export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = TEXT.split(" ");

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
      <SectionLabel>About</SectionLabel>
      <p
        ref={ref}
        className="mt-5 text-[1.5rem] leading-[1.25] font-medium tracking-[-0.03em] text-foreground sm:text-[2rem]"
      >
        {reduce
          ? TEXT
          : words.map((w, i) => (
              <Word key={i} word={w} index={i} total={words.length} progress={scrollYProgress} />
            ))}
      </p>
    </section>
  );
}
