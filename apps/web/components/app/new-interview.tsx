"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, Mic, Star } from "lucide-react";
import type { GithubRepo, InterviewView, Role } from "@repo/contracts";
import { Card, MonoLabel } from "@/components/app/card";
import { ConnectFirst, Empty, LoadingCards } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/me";
import { DIMENSION_LABEL, ROLES, ROLE_HINT, ROLE_LABEL, STEP_LABEL, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const SHOWN = 6;
const STEPS = ["reading_repos", "building_fact_sheet", "writing_plan"] as const;
const LATEST = 3;

function Choice({
  selected,
  onSelect,
  disabled,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border bg-white p-3.5 text-left transition-[border-color,box-shadow] duration-200 disabled:cursor-not-allowed",
        selected
          ? "border-foreground/70 shadow-[0_0_0_3px_oklch(0_0_0/6%)]"
          : "border-black/[0.08] enabled:hover:border-black/20",
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

function PlanStatus({ view, onRetry }: { view: InterviewView; onRetry: () => void }) {
  if (view.status === "preparing") {
    const current = view.step ? STEPS.indexOf(view.step) : 0;
    return (
      <ul className="mt-4 space-y-2.5" aria-live="polite">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 font-mono text-[0.75rem]">
            <span className="grid size-4 place-items-center">
              {i < current ? (
                <Check className="size-3.5" />
              ) : i === current ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-black/20" />
              )}
            </span>
            <span className={i <= current ? "text-foreground" : "text-muted-foreground"}>{STEP_LABEL[s]}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (view.status === "failed") {
    return (
      <div role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/[0.04] p-4">
        <p className="text-[0.8125rem] font-medium text-destructive">Couldn't prepare this interview.</p>
        <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">{view.failure?.reason}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (view.status === "ready" || view.status === "live") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-4">
        <p className="text-[0.8125rem] text-muted-foreground">{view.summary}</p>
        <p className="mt-3 rounded-xl bg-black/[0.03] p-3 text-[0.8125rem] text-foreground/80 italic">“{view.plan.opener}”</p>
        <ol className="mt-3 divide-y divide-black/[0.05]">
          {view.plan.questions.map((q, i) => (
            <motion.li
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: 0.06 * i }}
              className="grid grid-cols-[1.5rem_1fr] gap-2 py-3"
            >
              <span className="font-mono text-[0.6875rem] text-muted-foreground">0{i + 1}</span>
              <span>
                <span className="block text-[0.8125rem]">{q.ask}</span>
                <span className="mt-1.5 inline-flex rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
                  {DIMENSION_LABEL[q.dimension]}
                </span>
              </span>
            </motion.li>
          ))}
        </ol>
      </motion.div>
    );
  }

  return null;
}

export function NewInterview({ initialRepo }: { initialRepo?: string }) {
  const { candidate, isLoading } = useMe();
  const [mode, setMode] = useState<"latest" | "one">(initialRepo ? "one" : "latest");
  const [repo, setRepo] = useState<string | null>(initialRepo ?? null);
  const [role, setRole] = useState<Role>("backend");
  const [showAll, setShowAll] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: view } = useSWR(interviewId ? ["interview", interviewId] : null, () => api.getInterview(interviewId!), {
    refreshInterval: (latest) => (latest?.status === "preparing" ? 1500 : 0),
  });

  if (isLoading) return <LoadingCards count={2} />;
  if (!candidate) return <ConnectFirst />;

  const repos = candidate.github.repos
    .filter((r) => !r.isFork)
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const selected: GithubRepo | undefined = repos.find((r) => r.fullName === repo) ?? repos[0];
  const latest = repos.slice(0, LATEST);
  const covered = mode === "latest" ? latest : selected ? [selected] : [];
  const coveredLabel = covered.map((r) => r.name).join(", ");
  const locked = interviewId !== null;
  const ready = view?.status === "ready";

  const prepare = async () => {
    if (!selected) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createInterview({
        role,
        repo: mode === "one" ? selected.fullName : undefined,
      });
      setInterviewId(created.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setInterviewId(null);
    setError(null);
  };

  if (!repos.length) {
    return (
      <Empty
        className="mt-8 py-16"
        title="No repos to interview on"
        body={`@${candidate.github.login} has no public repos of their own yet. Push one, then refresh GitHub on the Sources page.`}
        action={{ label: "Open Sources", href: "/sources" }}
      />
    );
  }

  return (
    <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-3">
        <Card className="p-5">
          <StepLabel n={1} title="What should the interview cover?" done={locked} />
          <div role="radiogroup" aria-label="Interview scope" className="mt-4 inline-flex rounded-full bg-black/[0.04] p-1">
            {(
              [
                ["latest", "Latest projects"],
                ["one", "One repo, in depth"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                disabled={locked}
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-mono text-[0.6875rem] transition-colors disabled:cursor-not-allowed",
                  mode === value ? "bg-white text-foreground shadow-[0_1px_2px_oklch(0_0_0/8%)]" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "latest" ? (
            <>
              <p className="mt-4 text-[0.8125rem] text-muted-foreground">
                Your profile plus your {latest.length} most recently pushed repos. Questions span all of them.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {latest.map((r) => (
                  <li key={r.fullName} className="rounded-xl border border-black/[0.08] bg-white p-3.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.8125rem] font-medium">{r.name}</span>
                      <Check className="size-3.5 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[0.75rem] text-muted-foreground">
                      {r.description ?? "No description"}
                    </span>
                    <span className="mt-2.5 block font-mono text-[0.625rem] text-muted-foreground">
                      {r.language ?? "—"} · {formatDate(r.pushedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div role="radiogroup" aria-label="Repository" className="mt-4 grid gap-2 sm:grid-cols-2">
                {(showAll ? repos : repos.slice(0, SHOWN)).map((r) => (
                  <Choice
                    key={r.fullName}
                    selected={selected?.fullName === r.fullName}
                    disabled={locked}
                    onSelect={() => setRepo(r.fullName)}
                  >
                    <span className="block truncate pr-6 text-[0.8125rem] font-medium">{r.name}</span>
                    <span className="mt-1 line-clamp-1 block text-[0.75rem] text-muted-foreground">
                      {r.description ?? "No description"}
                    </span>
                    <span className="mt-2.5 flex items-center gap-2 font-mono text-[0.625rem] text-muted-foreground">
                      {r.language ?? "—"} · <Star className="size-2.5" /> {r.stars} · {formatDate(r.pushedAt)}
                    </span>
                  </Choice>
                ))}
              </div>
              {repos.length > SHOWN && !locked && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-3 font-mono text-[0.6875rem] text-muted-foreground underline decoration-black/20 underline-offset-4 hover:text-foreground"
                >
                  {showAll ? "Show fewer" : `Show all ${repos.length}`}
                </button>
              )}
            </>
          )}
        </Card>

        <Card className="p-5">
          <StepLabel n={2} title="Which role are you practicing for?" done={locked} />
          <div role="radiogroup" aria-label="Role" className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {ROLES.map((r) => (
              <Choice key={r} selected={role === r} disabled={locked} onSelect={() => setRole(r)}>
                <span className="block text-[0.8125rem] font-medium">{ROLE_LABEL[r]}</span>
                <span className="mt-1 block font-mono text-[0.625rem] text-muted-foreground">{ROLE_HINT[r]}</span>
              </Choice>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <StepLabel n={3} title="Your question plan" done={ready} />
          <AnimatePresence mode="wait" initial={false}>
            {!view ? (
              <motion.div key="choose" exit={{ opacity: 0 }} className="mt-4">
                <p className="text-[0.8125rem] text-muted-foreground">
                  We read your profile and <span className="font-mono text-foreground">{coveredLabel}</span>, pick the claims and
                  code worth asking about, and write five questions. Takes under a minute.
                </p>
                <Button className="mt-4" onClick={prepare} disabled={creating || !selected}>
                  {creating ? <Loader2 className="animate-spin" /> : null}
                  {creating ? "Starting…" : "Prepare interview"} {!creating && <ArrowRight />}
                </Button>
                {error && <p className="mt-2 font-mono text-[0.6875rem] text-destructive">{error}</p>}
              </motion.div>
            ) : (
              <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PlanStatus view={view} onRetry={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <Card className="p-5">
          <MonoLabel>Summary</MonoLabel>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            {[
              [mode === "latest" ? "Projects" : "Repo", coveredLabel || "—"],
              ["Role", ROLE_LABEL[role]],
              ["LinkedIn", candidate.linkedin ? "Included" : "Not added"],
              ["Length", "5 minutes, voice"],
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
          {ready ? (
            <Link href={`/interviews/${interviewId}/call`} className={buttonVariants({ className: "mt-5 w-full" })}>
              Go to the call <ArrowRight />
            </Link>
          ) : (
            <Button className="mt-5 w-full" disabled>
              {view?.status === "preparing" ? "Preparing…" : "Prepare first"}
            </Button>
          )}
          {locked && view?.status !== "preparing" && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Change projects or role
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
