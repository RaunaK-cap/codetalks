"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import type { InterviewView, Line } from "@repo/contracts";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { ScoreBar, ScorePips, SourceIcon } from "@/components/app/score";
import { Empty, ErrorNote, LoadingCards } from "@/components/app/states";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errorMessage } from "@/lib/api";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  ROLE_LABEL,
  SCREEN_LABEL,
  average,
  formatDate,
  formatDuration,
  practiceAgainHref,
  reposTitle,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

type Reported = Extract<InterviewView, { status: "reported" }>;

function Transcript({ lines }: { lines: Line[] }) {
  if (!lines.length) return <Empty title="No transcript" body="Nothing was recorded during this call." />;
  return (
    <ol className="space-y-4 p-5">
      {lines.map((l) => (
        <li key={l.seq} className="grid grid-cols-[5.5rem_1fr] gap-3">
          <span className="pt-0.5 font-mono text-[0.625rem] text-muted-foreground uppercase">
            {l.speaker === "interviewer" ? "Interviewer" : "You"}
          </span>
          <p className={cn("text-[0.8125rem] leading-relaxed", l.speaker === "interviewer" && "text-foreground/70")}>
            {l.text}
          </p>
        </li>
      ))}
    </ol>
  );
}

function FullReport({ view }: { view: Reported }) {
  const { report, plan } = view;
  const total = average(report.scores.map((s) => s.score)) ?? 0;
  const byDim = new Map(report.scores.map((s) => [s.dimension, s]));
  const weakDim = [...report.scores].sort((a, b) => a.score - b.score)[0]?.dimension;

  return (
    <>
      <div className="mt-6 grid gap-3 lg:grid-cols-[16rem_1fr]">
        <Card className="flex flex-col justify-between p-5">
          <MonoLabel>Overall</MonoLabel>
          <p className="mt-6 text-[3rem] leading-none font-medium tracking-[-0.05em] tabular-nums">
            {total.toFixed(1)}
            <span className="text-[1.25rem] text-muted-foreground">/5</span>
          </p>
          <span
            className={cn(
              "mt-4 inline-flex self-start rounded-full px-2.5 py-0.5 font-mono text-[0.6875rem]",
              report.screen === "strong_yes" || report.screen === "yes"
                ? "bg-foreground text-background"
                : "border border-black/15 text-foreground",
            )}
          >
            {SCREEN_LABEL[report.screen]}
          </span>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">{report.overall}</p>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {DIMENSIONS.map((d) => {
            const s = byDim.get(d);
            return (
              <Card key={d} className={cn("flex flex-col p-4", d === weakDim && "border-foreground/30")}>
                <MonoLabel>{DIMENSION_LABEL[d]}</MonoLabel>
                <p className="mt-3 text-[1.5rem] leading-none font-medium tabular-nums">
                  {s?.score ?? "—"}
                  <span className="text-[0.875rem] text-muted-foreground">/5</span>
                </p>
                <ScoreBar value={s?.score ?? 0} className="mt-4" />
                {d === weakDim && <span className="mt-2 font-mono text-[0.625rem] text-muted-foreground">Weakest</span>}
              </Card>
            );
          })}
          <Card className="col-span-2 grid gap-4 p-4 sm:col-span-5 sm:grid-cols-2">
            <div>
              <MonoLabel>Strongest moment</MonoLabel>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed">{report.strongest}</p>
            </div>
            <div>
              <MonoLabel>Weakest moment</MonoLabel>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed">{report.weakest}</p>
            </div>
          </Card>
          <Card className="col-span-2 p-4 sm:col-span-5">
            <MonoLabel>Next time</MonoLabel>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
              {report.nextFocus.map((f) => (
                <li key={f} className="flex gap-2 text-[0.8125rem]">
                  <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-live" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="questions" className="mt-8">
        <TabsList className="h-9 rounded-full bg-black/[0.04] p-1">
          <TabsTrigger value="questions" className="rounded-full px-3.5 font-mono text-[0.6875rem]">
            Questions ({plan.questions.length})
          </TabsTrigger>
          <TabsTrigger value="scores" className="rounded-full px-3.5 font-mono text-[0.6875rem]">
            Scores
          </TabsTrigger>
          <TabsTrigger value="transcript" className="rounded-full px-3.5 font-mono text-[0.6875rem]">
            Transcript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-3 grid gap-3">
          {plan.questions.map((q, i) => {
            const result = report.perQuestion.find((p) => p.questionId === q.id);
            return (
              <Card key={q.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.6875rem] text-muted-foreground">
                  <span>
                    <span className="text-foreground">Q{i + 1}</span> · {DIMENSION_LABEL[q.dimension]}
                  </span>
                  {result?.score ? (
                    <span className="flex items-center gap-2">
                      <ScorePips value={result.score} /> <span className="text-foreground tabular-nums">{result.score}/5</span>
                    </span>
                  ) : (
                    <span>{result?.askedAs === null ? "Not asked" : "Not answered"}</span>
                  )}
                </div>
                <h3 className="mt-3 text-[0.9375rem] font-medium tracking-[-0.01em]">{result?.askedAs ?? q.ask}</h3>
                {result?.verdict && <p className="mt-2 text-[0.8125rem] leading-relaxed text-foreground/80">{result.verdict}</p>}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-black/[0.03] p-3.5">
                    <MonoLabel>You said</MonoLabel>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed">
                      {result?.quote ? `“${result.quote}”` : <span className="text-muted-foreground">Nothing on this question.</span>}
                    </p>
                  </div>
                  <div className="rounded-xl border border-black/[0.07] p-3.5">
                    <MonoLabel>A strong answer mentions</MonoLabel>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {q.strongAnswerMentions.map((m) => (
                        <li key={m} className="rounded-full border border-black/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem]">
                          {m}
                        </li>
                      ))}
                    </ul>
                    {result && result.missing.length > 0 && (
                      <>
                        <MonoLabel className="mt-3">Missing</MonoLabel>
                        <ul className="mt-1.5 space-y-1">
                          {result.missing.map((m) => (
                            <li key={m} className="flex gap-2 text-[0.8125rem]">
                              <span className="mt-[0.5rem] h-px w-2.5 shrink-0 bg-foreground" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="scores" className="mt-3 grid gap-3">
          {report.scores.map((s) => (
            <Card key={s.dimension} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[0.9375rem] font-medium">{DIMENSION_LABEL[s.dimension]}</h3>
                <ScorePips value={s.score} />
              </div>
              <p className="mt-3 text-[0.8125rem] leading-relaxed">“{s.quote}”</p>
              <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">Gap: {s.gap}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transcript" className="mt-3">
          <Card>
            <CardHead title="Full transcript" hint="Saved line by line during the call" />
            <Transcript lines={view.lines} />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export function ReportView({ id }: { id: string }) {
  const { data: view, error, mutate } = useSWR(["interview", id], () => api.getInterview(id), {
    refreshInterval: (latest) => (latest?.status === "finishing" || latest?.status === "preparing" ? 2000 : 0),
  });

  if (error) {
    return (
      <ErrorNote message={error.status === 404 ? "This interview doesn't exist." : errorMessage(error)} onRetry={() => mutate()}>
        <Link href="/history" className="mt-2 block font-mono text-[0.6875rem] underline underline-offset-4">
          Back to history
        </Link>
      </ErrorNote>
    );
  }
  if (!view) return <LoadingCards count={2} />;

  const length = "startedAt" in view && "endedAt" in view ? formatDuration(view.startedAt, view.endedAt) : null;
  const retest = practiceAgainHref(view.repos);

  return (
    <>
      <Link href="/history" className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> History
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
            <SourceIcon kind="github" className="size-3" />
            {view.repos.length > 1 ? `${view.repos.length} projects` : view.repos[0]} · {ROLE_LABEL[view.role]} ·{" "}
            {formatDate(view.createdAt)}
            {length && ` · ${length} min`}
          </p>
          <h1 className="mt-2 text-[1.5rem] leading-tight font-medium tracking-[-0.03em]">
            Interview report: {reposTitle(view.repos)}
          </h1>
        </div>
        <Link href={retest} className={buttonVariants({ shape: "soft" })}>
          <RotateCcw /> Practice again
        </Link>
      </div>

      {view.status === "reported" && <FullReport view={view} />}

      {view.status === "finishing" && (
        <Card className="mt-6 flex items-center gap-3 p-5" aria-live="polite">
          <Loader2 className="size-4 animate-spin" />
          <div>
            <p className="text-[0.875rem] font-medium">Scoring your answers</p>
            <p className="font-mono text-[0.6875rem] text-muted-foreground">Usually under a minute. This page updates by itself.</p>
          </div>
        </Card>
      )}

      {(view.status === "preparing" || view.status === "ready" || view.status === "live") && (
        <Empty
          className="mt-6 py-14"
          title="No report yet"
          body={view.status === "preparing" ? "The questions are still being written." : "The call hasn't finished."}
          action={view.status === "preparing" ? undefined : { label: "Go to the call", href: `/interviews/${view.id}/call` }}
        />
      )}

      {view.status === "report_failed" && (
        <>
          <ErrorNote message="We couldn't score this interview.">
            <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">{view.failure?.reason}</p>
          </ErrorNote>
          <Card className="mt-3">
            <CardHead title="Transcript" hint="Your answers are saved" />
            <Transcript lines={view.lines} />
          </Card>
        </>
      )}

      {view.status === "failed" && (
        <ErrorNote message="This interview couldn't be prepared.">
          <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">{view.failure?.reason}</p>
        </ErrorNote>
      )}
    </>
  );
}
