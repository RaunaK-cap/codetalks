"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowUpRight, Plus, RotateCcw } from "lucide-react";
import type { Dimension, InterviewSummary } from "@repo/contracts";
import { Card, CardHead, MonoLabel, PageHeader } from "@/components/app/card";
import { ScoreBar, ScoreNumber, Sparkline, SourceIcon } from "@/components/app/score";
import { ConnectFirst, Empty, ErrorNote, LoadingCards, Skeleton } from "@/components/app/states";
import { buttonVariants } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/me";
import { DIMENSIONS, DIMENSION_LABEL, average, practiceAgainHref } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Scored = InterviewSummary & { scores: NonNullable<InterviewSummary["scores"]> };

const scoreOf = (i: Scored, d: Dimension) => i.scores.find((s) => s.dimension === d)?.score ?? 0;
const overallOf = (i: Scored) => average(i.scores.map((s) => s.score)) ?? 0;

function NextFocus({ latest }: { latest: Scored | undefined }) {
  const { data, isLoading } = useSWR(latest ? ["interview", latest.id] : null, () => api.getInterview(latest!.id));
  const report = data?.status === "reported" ? data.report : null;

  return (
    <Card className="flex flex-col p-5 lg:col-span-3">
      <MonoLabel>Next focus</MonoLabel>
      {!latest ? (
        <Empty
          className="mt-4 flex-1"
          title="No report yet"
          body="Finish your first interview and your next focus areas show up here."
          action={{ label: "Start an interview", href: "/interviews/new" }}
        />
      ) : isLoading || !report ? (
        <div className="mt-4 space-y-2.5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      ) : (
        <>
          <h2 className="mt-3 text-[1.125rem] font-medium tracking-[-0.02em]">From your last interview</h2>
          <ol className="mt-4 space-y-2.5">
            {report.nextFocus.map((f, i) => (
              <li key={f} className="grid grid-cols-[1.5rem_1fr] gap-2 text-[0.8125rem] leading-relaxed">
                <span className="font-mono text-[0.6875rem] text-muted-foreground">0{i + 1}</span>
                {f}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-2 lg:mt-auto lg:pt-6">
            <Link href={practiceAgainHref(latest.repos)} className={buttonVariants({ size: "sm" })}>
              <RotateCcw /> Practice again
            </Link>
            <Link href={`/interviews/${latest.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Last report <ArrowUpRight />
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

function WeakestArea({ scored }: { scored: Scored[] }) {
  if (!scored.length) {
    return (
      <Card className="flex flex-col p-5 lg:col-span-2">
        <MonoLabel>Weakest area</MonoLabel>
        <Empty className="mt-4 flex-1" title="Not enough data yet" body="Shows after your first scored interview." />
      </Card>
    );
  }

  const avg = (d: Dimension) => average(scored.map((i) => scoreOf(i, d))) ?? 0;
  const [weak, runnerUp] = [...DIMENSIONS].sort((a, b) => avg(a) - avg(b));
  const history = [...scored].reverse().slice(-6);
  const lowestCount = scored.filter((i) => DIMENSIONS.every((d) => scoreOf(i, weak!) <= scoreOf(i, d))).length;

  return (
    <Card className="flex flex-col p-5 lg:col-span-2">
      <MonoLabel>Weakest area</MonoLabel>
      <div className="mt-3 flex items-baseline justify-between">
        <h2 className="text-[1.375rem] font-medium tracking-[-0.03em]">{DIMENSION_LABEL[weak!]}</h2>
        <ScoreNumber value={avg(weak!)} className="text-[0.875rem]" />
      </div>
      <ScoreBar value={avg(weak!)} className="mt-3" />
      <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
        Your lowest score in {lowestCount} of {scored.length} interview{scored.length === 1 ? "" : "s"}. Next lowest is{" "}
        {DIMENSION_LABEL[runnerUp!].toLowerCase()} at {avg(runnerUp!).toFixed(1)}.
      </p>
      <div className="mt-5 lg:mt-auto lg:pt-5">
        <MonoLabel>Last {history.length} interviews</MonoLabel>
        <ul className="mt-2 flex items-end gap-2" aria-label={`${DIMENSION_LABEL[weak!]} over time`}>
          {history.map((h) => (
            <li key={h.id} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="flex h-12 w-full items-end overflow-hidden rounded-md bg-black/[0.04]">
                <span
                  className="w-full rounded-md bg-foreground"
                  style={{ height: `${(scoreOf(h, weak!) / 5) * 100}%` }}
                />
              </span>
              <span className="font-mono text-[0.625rem] text-muted-foreground tabular-nums">{scoreOf(h, weak!)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function Progress({ scored }: { scored: Scored[] }) {
  const trend = [...scored].reverse().map(overallOf);
  return (
    <Card className="lg:col-span-3">
      <CardHead title="Progress" hint="Average across your scored interviews" />
      {!scored.length ? (
        <div className="p-5">
          <Empty title="No scores yet" body="Your five dimension scores appear after the first report." />
        </div>
      ) : (
        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_14rem]">
          <ul className="space-y-3">
            {DIMENSIONS.map((d) => {
              const v = average(scored.map((i) => scoreOf(i, d))) ?? 0;
              return (
                <li key={d} className="grid grid-cols-[6.5rem_1fr_2.75rem] items-center gap-3">
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">{DIMENSION_LABEL[d]}</span>
                  <ScoreBar value={v} />
                  <ScoreNumber value={v} className="text-right text-[0.6875rem]" />
                </li>
              );
            })}
          </ul>
          <div>
            <MonoLabel>Overall, last {trend.length}</MonoLabel>
            {trend.length > 1 ? (
              <>
                <Sparkline values={trend} className="mt-2 text-foreground" />
                <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                  {trend[0]!.toFixed(1)} → <span className="text-foreground">{trend.at(-1)!.toFixed(1)}</span>
                </p>
              </>
            ) : (
              <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground">
                {trend[0]!.toFixed(1)}/5. The trend line appears after your second interview.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Sources({ login, repos, linkedin }: { login: string; repos: number; linkedin: boolean }) {
  return (
    <Card className="lg:col-span-2">
      <CardHead
        title="Sources"
        hint="What interviews are built from"
        action={
          <Link href="/sources" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Manage
          </Link>
        }
      />
      <ul className="mt-3 divide-y divide-black/[0.05] px-5 pb-2">
        {[
          { kind: "github" as const, name: "GitHub", meta: `@${login} · ${repos} repos`, on: true },
          { kind: "linkedin" as const, name: "LinkedIn", meta: linkedin ? "Profile read" : "Optional: add screenshots", on: linkedin },
        ].map((s) => (
          <li key={s.name} className="flex items-center gap-3 py-3">
            <span className="grid size-8 place-items-center rounded-lg border border-black/[0.08]">
              <SourceIcon kind={s.kind} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-medium">{s.name}</span>
              <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">{s.meta}</span>
            </span>
            {s.on ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-live" /> Ready
              </span>
            ) : (
              <Link href="/sources" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Add
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DashboardView() {
  const { user, candidate, isLoading, error, mutate } = useMe();
  const list = useSWR(candidate ? "interviews" : null, api.listInterviews);

  if (isLoading || !user) return error ? <ErrorNote message={errorMessage(error)} onRetry={() => mutate()} /> : <LoadingCards count={3} />;
  if (!candidate) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${user.name.split(" ")[0]}`}
          description="Connect GitHub, then take a five-minute voice interview."
        />
        <ConnectFirst />
      </>
    );
  }

  const scored = (list.data ?? []).filter((i): i is Scored => i.status === "reported" && i.scores !== null);
  const name = user.name || candidate.github.name || candidate.github.login;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description={
          list.data
            ? `${list.data.length} interview${list.data.length === 1 ? "" : "s"} · ${scored.length} scored`
            : "Loading your interviews…"
        }
        actions={
          <Link href="/interviews/new" className={buttonVariants({ shape: "soft" })}>
            <Plus /> New interview
          </Link>
        }
      />

      {list.error && <ErrorNote message={errorMessage(list.error)} onRetry={() => list.mutate()} />}

      {list.isLoading ? (
        <LoadingCards count={2} className="lg:grid-cols-2" />
      ) : (
        <>
          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            <NextFocus latest={scored[0]} />
            <WeakestArea scored={scored} />
          </div>
          <div className={cn("mt-3 grid gap-3 lg:grid-cols-5")}>
            <Progress scored={scored} />
            <Sources
              login={candidate.github.login}
              repos={candidate.github.repos.length}
              linkedin={!!candidate.linkedin}
            />
          </div>
        </>
      )}
    </>
  );
}
