"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/*
 * Animated halftone: a grid of diamond dots whose size follows a field.
 *   "voice"  a dithered sound wave that breathes, for the landing hero.
 *   "cloud"  an organic mass drifting in from the right, for auth and CTA panels.
 *
 * Performance: the expensive noise is computed once per resize and cached per dot.
 * Each frame only evaluates cheap terms (one exp or one sin per dot), at 24fps (voice) or 8fps (cloud),
 * and the loop pauses offscreen and in hidden tabs. Reduced motion draws one frame.
 * Dot colour follows the theme (the canvas's CSS `color`).
 */

type Variant = "voice" | "cloud";

type Props = {
  variant: Variant;
  cell?: number;
  className?: string;
};

// The voice wave moves quickly; the cloud drifts slowly, so it needs far fewer frames.
const FRAME_MS: Record<Variant, number> = { voice: 1000 / 24, cloud: 1000 / 8 };

/* Dot sizes are quantised into this many levels, each pre-drawn once into a sprite sheet. */
const LEVELS = 12;

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
  return (
    noise(x, y) * 0.55 +
    noise(x * 2.1, y * 2.1) * 0.3 +
    noise(x * 4.3, y * 4.3) * 0.15
  );
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* Per-dot data that only changes on resize. */
type Grid = {
  count: number;
  cols: number;
  x: Float32Array; // pixel position
  y: Float32Array;
  col: Uint16Array; // column index (voice: per-column wave)
  ny: Float32Array; // 0..1 vertical position
  base: Float32Array; // cached static noise
  phase: Float32Array; // cloud: swirl phase
};

function buildGrid(
  variant: Variant,
  width: number,
  height: number,
  cell: number,
): Grid {
  const cols = Math.ceil(width / cell) + 1;
  const rows = Math.ceil(height / cell) + 1;
  const count = cols * rows;
  const g: Grid = {
    count,
    cols,
    x: new Float32Array(count),
    y: new Float32Array(count),
    col: new Uint16Array(count),
    ny: new Float32Array(count),
    base: new Float32Array(count),
    phase: new Float32Array(count),
  };
  const aspect = width / Math.max(1, height);

  let k = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++, k++) {
      const px = i * cell + (j % 2 ? cell / 2 : 0);
      const py = j * cell;
      const nx = px / width;
      const ny = py / height;
      g.x[k] = px;
      g.y[k] = py;
      g.col[k] = i;
      g.ny[k] = ny;
      if (variant === "voice") {
        g.base[k] = fbm(nx * 9, ny * 6) * 0.55 + 0.45; // grain
      } else {
        const n = fbm(nx * 2.2 * aspect * 0.6, ny * 2.2);
        const bias = smoothstep(0.05, 0.85, nx) * 0.55 + 0.1;
        g.base[k] = n * 0.9 + bias * 0.55;
        g.phase[k] = ny * 7 + nx * 3;
      }
    }
  }
  return g;
}

export function Halftone({ variant, cell = 8, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = 0;
    let height = 0;
    let grid: Grid | null = null;
    let center = new Float32Array(0);
    let spread = new Float32Array(0);
    let edge = new Float32Array(0);
    let ink = getComputedStyle(canvas).color;
    let dpr = 1;
    let size = 1; // sprite cell, in device pixels
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");

    // One diamond per size level, drawn once. Stamping sprites is far cheaper than
    // filling a single path with thousands of sub-shapes every frame.
    const buildAtlas = () => {
      if (!actx) return;
      size = Math.max(2, Math.round(cell * dpr));
      atlas.width = size * LEVELS;
      atlas.height = size;
      actx.clearRect(0, 0, atlas.width, atlas.height);
      actx.fillStyle = ink;
      for (let l = 1; l <= LEVELS; l++) {
        const r = (size / 2) * (l / LEVELS) * 0.95;
        const cx = (l - 1) * size + size / 2;
        const cy = size / 2;
        actx.beginPath();
        actx.moveTo(cx, cy - r);
        actx.lineTo(cx + r, cy);
        actx.lineTo(cx, cy + r);
        actx.lineTo(cx - r, cy);
        actx.closePath();
        actx.fill();
      }
    };
    let raf = 0;
    let visible = true;
    let last = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      buildAtlas();
      grid = buildGrid(variant, width, height, cell);
      center = new Float32Array(grid.cols);
      spread = new Float32Array(grid.cols);
      edge = new Float32Array(grid.cols);
    };

    const draw = (time: number) => {
      if (!grid) return;
      const t = (time - start) / 1000;
      const g = grid;
      const aspectFix = Math.min(1, (1.6 * height) / Math.max(1, width) + 0.4);

      if (variant === "voice") {
        // The wave is computed per column (~200 values), not per dot.
        for (let i = 0; i < g.cols; i++) {
          const nx = (i * cell) / width;
          center[i] =
            0.5 +
            0.1 * Math.sin(nx * 5.2 + t * 0.7) +
            0.05 * Math.sin(nx * 12.7 - t * 1.4);
          const env =
            0.35 +
            0.65 * Math.pow(Math.abs(Math.sin(nx * 2.4 + t * 0.45)), 1.4);
          spread[i] = (0.06 + 0.16 * env) * aspectFix;
          edge[i] = smoothstep(0, 0.12, nx) * smoothstep(1, 0.88, nx);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const half = size / 2;
      const swirlT = t * 0.25;

      for (let k = 0; k < g.count; k++) {
        let v: number;
        if (variant === "voice") {
          const c = g.col[k]!;
          const e = edge[c]!;
          if (e === 0) continue;
          const d = (g.ny[k]! - center[c]!) / spread[c]!;
          if (d > 2.2 || d < -2.2) continue; // exp(-d²) is negligible here
          v = Math.exp(-d * d) * g.base[k]! * e;
        } else {
          v = smoothstep(0.42, 0.78, g.base[k]! + 0.12 * Math.sin(g.phase[k]! + swirlT));
        }
        if (v < 0.08) continue;
        const level = v >= 1 ? LEVELS : Math.max(1, Math.round(v * LEVELS));
        ctx.drawImage(
          atlas,
          (level - 1) * size,
          0,
          size,
          size,
          Math.round(g.x[k]! * dpr - half),
          Math.round(g.y[k]! * dpr - half),
          size,
          size,
        );
      }
    };

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || time - last < FRAME_MS[variant]) return;
      last = time;
      draw(time);
    };

    resize();
    draw(performance.now());

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    // Theme switch: pick up the new dot colour.
    const mo = new MutationObserver(() => {
      ink = getComputedStyle(canvas).color;
      buildAtlas();
      draw(performance.now());
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
    };
  }, [variant, cell]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("block h-full w-full text-foreground", className)}
    />
  );
}
