"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, Mic, Star } from "lucide-react";
import { Card, MonoLabel } from "@/components/app/card";
import { Dropzone } from "@/components/app/dropzone";
import { SourceIcon } from "@/components/app/score";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIMENSIONS, DIMENSION_LABEL, ROLES, planPreview, sources, type Dimension } from "@/lib/mock";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const ROLE_HINT: Record<(typeof ROLES)[number], string> = {
  Backend: "APIs, data, reliability",
  Frontend: "UI state, performance, a11y",
  "Full-stack": "End to end, tradeoffs",
  "New grad": "Fundamentals, projects",
};

const PREP_STEPS = ["Reading your source", "Building the fact sheet", "Writing the question plan"];

type Phase = "choose" | "preparing" | "ready";

function Choice({
  selected,
  onSelect,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200",
        selected
          ? "border-foreground/70 bg-white shadow-[0_0_0_3px_oklch(0_0_0/6%)]"
          : "border-black/[0.08] bg-white hover:border-black/20",
        className,
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 grid size-4 place-items-center rounded-full bg-foreground text-background">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

function StepLabel({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full font-mono text-[0.625rem]",
          done ? "bg-foreground text-background" : "border border-black/15 text-muted-foreground",
        )}
      >
        {done ? <Check className="size-2.5" strokeWidth={3} /> : n}
      </span>
      <h2 className="text-[0.875rem] font-medium">{title}</h2>
    </div>
  );
}

export function NewInterview({
  initialRepo,
  initialRole,
  focus,
}: {
  initialRepo?: string;
  initialRole?: string;
  focus?: string;
}) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<string>(initialRepo === "resume" ? "resume" : "github");
  const [repo, setRepo] = useState(initialRepo?.startsWith("repo:") ? initialRepo.slice(5) : sources.github.repos[0]!.name);
  const [url, setUrl] = useState("");
  const [role, setRole] = useState<string>(ROLES.includes(initialRole as never) ? initialRole! : "Backend");
  const [focusDims, setFocusDims] = useState<Dimension[]>(
    DIMENSIONS.includes(focus as Dimension) ? [focus as Dimension] : [],
  );
  const [phase, setPhase] = useState<Phase>("choose");
  const [step, setStep] = useState(0);

  const needsUrl = tab === "github" && !sources.github.connected && !url.trim();
  const sourceLabel = tab === "github" ? (url.trim() || (sources.github.connected ? repo : "No repo yet")) : tab === "resume" ? "resume.pdf" : "LinkedIn PDF";

  useEffect(() => {
    if (phase !== "preparing") return;
    if (step >= PREP_STEPS.length) {
      setPhase("ready");
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), reduce ? 200 : 1100);
    return () => clearTimeout(id);
  }, [phase, step, reduce]);

  const prepare = () => {
    setStep(0);
    setPhase("preparing");
  };

  return (
    <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-3">
        <Card className="p-5">
          <StepLabel n={1} title="What should we interview you on?" done={phase !== "choose"} />
          <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className="mt-4">
            <TabsList className="h-9 rounded-full bg-black/[0.04] p-1">
              {[
                { v: "github", label: "GitHub repo", kind: "github" as const },
                { v: "resume", label: "Resume", kind: "resume" as const },
                { v: "linkedin", label: "LinkedIn", kind: "linkedin" as const },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  disabled={phase !== "choose"}
                  className="rounded-full px-3 font-mono text-[0.6875rem] data-active:shadow-[0_1px_2px_oklch(0_0_0/8%)]"
                >
                  <SourceIcon kind={t.kind} className="size-3" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="github" className="mt-3">
              {sources.github.connected ? (
              <div role="radiogroup" aria-label="Repository" className="grid gap-2 sm:grid-cols-2">
                {sources.github.repos.map((r) => (
                  <Choice
                    key={r.name}
                    selected={!url && repo === r.name}
                    onSelect={() => {
                      if (phase !== "choose") return;
                      setRepo(r.name);
                      setUrl("");
                    }}
                  >
                    <span className="block pr-6 text-[0.8125rem] font-medium">{r.name}</span>
                    <span className="mt-1 line-clamp-1 block text-[0.75rem] text-muted-foreground">{r.description}</span>
                    <span className="mt-2.5 flex items-center gap-2 font-mono text-[0.625rem] text-muted-foreground">
                      {r.lang} · <Star className="size-2.5" /> {r.stars} · {r.pushed}
                    </span>
                  </Choice>
                ))}
              </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-black/[0.12] p-3.5">
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">
                    Connect GitHub to pick from your repos, or paste a public repo URL below.
                  </span>
                  <Link href="/sources" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Connect GitHub
                  </Link>
                </div>
              )}
              <div className="mt-3">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={phase !== "choose"}
                  placeholder="Or paste any public repo URL: github.com/owner/repo"
                  aria-label="Public repo URL"
                />
              </div>
            </TabsContent>
            <TabsContent value="resume" className="mt-3">
              <div className="flex items-center gap-3 rounded-xl border border-foreground/70 p-3 shadow-[0_0_0_3px_oklch(0_0_0/6%)]">
                <span className="grid size-9 place-items-center rounded-lg bg-black/[0.04]">
                  <SourceIcon kind="resume" />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.8125rem] font-medium">resume.pdf</span>
                  <span className="block font-mono text-[0.6875rem] text-muted-foreground">2 pages · already added</span>
                </span>
              </div>
            </TabsContent>
            <TabsContent value="linkedin" className="mt-3">
              <Dropzone label="Add LinkedIn PDF" hint="Profile → More → Save to PDF" />
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-5">
          <StepLabel n={2} title="Which role are you practicing for?" done={phase !== "choose"} />
          <div role="radiogroup" aria-label="Role" className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {ROLES.map((r) => (
              <Choice key={r} selected={role === r} onSelect={() => phase === "choose" && setRole(r)}>
                <span className="block text-[0.8125rem] font-medium">{r}</span>
                <span className="mt-1 block font-mono text-[0.625rem] text-muted-foreground">{ROLE_HINT[r]}</span>
              </Choice>
            ))}
          </div>
          <MonoLabel className="mt-5">Push harder on (optional)</MonoLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DIMENSIONS.map((d) => {
              const on = focusDims.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  disabled={phase !== "choose"}
                  onClick={() => setFocusDims((f) => (on ? f.filter((x) => x !== d) : [...f, d]))}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[0.6875rem] transition-colors",
                    on ? "border-foreground bg-foreground text-background" : "border-black/10 text-muted-foreground hover:border-black/25 hover:text-foreground",
                  )}
                >
                  {DIMENSION_LABEL[d]}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <StepLabel n={3} title="Your question plan" done={phase === "ready"} />
          <AnimatePresence mode="wait" initial={false}>
            {phase === "choose" && (
              <motion.div key="choose" exit={{ opacity: 0 }} className="mt-4">
                <p className="text-[0.8125rem] text-muted-foreground">
                  We read <span className="font-mono text-foreground">{sourceLabel}</span>, pick the claims and code worth
                  asking about, and write five questions. Takes about twenty seconds.
                </p>
                <Button className="mt-4" onClick={prepare} disabled={needsUrl}>
                  Prepare interview <ArrowRight />
                </Button>
              </motion.div>
            )}
            {phase === "preparing" && (
              <motion.ul key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2.5">
                {PREP_STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 font-mono text-[0.75rem]">
                    <span className="grid size-4 place-items-center">
                      {i < step ? (
                        <Check className="size-3.5" />
                      ) : i === step ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-black/20" />
                      )}
                    </span>
                    <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                  </li>
                ))}
              </motion.ul>
            )}
            {phase === "ready" && (
              <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-4">
                <p className="rounded-xl bg-black/[0.03] p-3 text-[0.8125rem] italic text-foreground/80">“{planPreview.opener}”</p>
                <ol className="mt-3 divide-y divide-black/[0.05]">
                  {planPreview.questions.map((q, i) => (
                    <motion.li
                      key={q.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease, delay: 0.08 * i }}
                      className="grid grid-cols-[1.5rem_1fr] gap-2 py-3"
                    >
                      <span className="font-mono text-[0.6875rem] text-muted-foreground">0{i + 1}</span>
                      <span>
                        <span className="block text-[0.8125rem]">{q.ask}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[0.625rem] text-muted-foreground">
                          <span className="rounded-md border border-black/[0.08] px-1.5 py-0.5">{q.cite}</span>
                          <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5">{DIMENSION_LABEL[q.dimension]}</span>
                        </span>
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Summary rail */}
      <div className="lg:sticky lg:top-10 lg:self-start">
        <Card className="p-5">
          <MonoLabel>Summary</MonoLabel>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            {[
              ["Source", sourceLabel],
              ["Role", role],
              ["Focus", focusDims.length ? focusDims.map((d) => DIMENSION_LABEL[d]).join(", ") : "Balanced"],
              ["Length", "6 minutes, voice"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="font-mono text-[0.6875rem] text-muted-foreground">{k}</dt>
                <dd className="truncate text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-xl border border-black/[0.07] p-3 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground">
            <Mic className="mb-1.5 size-3.5 text-foreground" />
            Uses your microphone. The call is recorded so you can replay it. Find a quiet spot.
          </div>
          {phase === "ready" ? (
            <Link href={`/interviews/${tab === "github" ? (url ? "custom" : repo) : "resume-nov"}/call`} className={buttonVariants({ className: "mt-5 w-full" })}>
              Start the call <ArrowRight />
            </Link>
          ) : (
            <Button className="mt-5 w-full" disabled>
              {phase === "preparing" ? "Preparing…" : "Prepare first"}
            </Button>
          )}
          {phase === "ready" && (
            <button
              type="button"
              onClick={() => setPhase("choose")}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Change source or role
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
