"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/*
 * Animated halftone: a grid of diamond dots whose size follows a field.
 *   "voice"  a dithered sound wave that breathes, for the landing hero.
 *   "cloud"  an organic mass drifting in from the right, for auth and CTA panels.
 * Pauses offscreen and in hidden tabs. Reduced motion draws one still frame.
 */

type Variant = "voice" | "cloud";

type Props = {
  variant: Variant;
  cell?: number;
  className?: string;
  ink?: string;
};

function hash(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number) {
  return noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* x and y are 0..1 across the canvas; aspect is width / height. */
function voice(x: number, y: number, t: number, aspect: number) {
  const center =
    0.5 +
    0.1 * Math.sin(x * 5.2 + t * 0.7) +
    0.05 * Math.sin(x * 12.7 - t * 1.4);
  const envelope = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(x * 2.4 + t * 0.45)), 1.4);
  const spread = (0.06 + 0.16 * envelope) * Math.min(1, 1.6 / aspect + 0.4);
  const d = (y - center) / spread;
  const band = Math.exp(-d * d);
  const grain = fbm(x * 9 + t * 0.3, y * 6) * 0.55 + 0.45;
  const edge = smoothstep(0, 0.12, x) * smoothstep(1, 0.88, x);
  return band * grain * edge;
}

function cloud(x: number, y: number, t: number, aspect: number) {
  const n = fbm(x * 2.2 * aspect * 0.6 + t * 0.04, y * 2.2 - t * 0.03);
  const bias = smoothstep(0.05, 0.85, x) * 0.55 + 0.1;
  const swirl = 0.12 * Math.sin(y * 7 + x * 3 + t * 0.25);
  return smoothstep(0.42, 0.78, n * 0.9 + bias * 0.55 + swirl);
}

export function Halftone({ variant, cell = 8, className, ink = "17, 17, 17" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const field = variant === "voice" ? voice : cloud;
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    let last = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = (time - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgb(${ink})`;
      ctx.beginPath();
      const aspect = width / Math.max(1, height);
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      for (let j = 0; j <= rows; j++) {
        const cy = j * cell;
        for (let i = 0; i <= cols; i++) {
          const cx = i * cell + (j % 2 ? cell / 2 : 0);
          const v = field(cx / width, cy / height, t, aspect);
          if (v < 0.08) continue;
          const r = (cell / 2) * Math.min(1, v) * 0.95;
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r, cy);
          ctx.closePath();
        }
      }
      ctx.fill();
    };

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (time - last < 33) return;
      last = time;
      draw(time);
    };

    resize();
    draw(start);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [variant, cell, ink]);

  return <canvas ref={ref} aria-hidden className={cn("block h-full w-full", className)} />;
}
