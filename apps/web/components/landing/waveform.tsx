"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/* Voice level bars. Each bar has its own rhythm so the motion never looks looped. */
export function Waveform({ bars = 28, className }: { bars?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className={cn("flex items-center gap-[3px]", className)}>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.25 + 0.6 * Math.abs(Math.sin(i * 1.7));
        const peak = Math.min(1, base + 0.35);
        return (
          <motion.span
            key={i}
            className="h-full w-[2px] origin-center rounded-full bg-foreground/80"
            initial={{ scaleY: base }}
            animate={reduce ? { scaleY: base } : { scaleY: [base, peak, 0.15, base] }}
            transition={{
              duration: 1.1 + (i % 5) * 0.17,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 7) * 0.09,
            }}
          />
        );
      })}
    </div>
  );
}
