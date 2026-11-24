import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus, RotateCcw } from "lucide-react";
import { Card, CardHead, MonoLabel, PageHeader } from "@/components/app/card";
import { ScoreBar, ScoreNumber, Sparkline, SourceIcon } from "@/components/app/score";
import { buttonVariants } from "@/components/ui/button";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  average,
  interviews,
  overall,
  report,
  sources,
  user,
  weakest,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard · CodeTalk" };

function EmptyState() {
  const steps = [
    { n: "01", title: "Connect a source", body: "A public repo, your resume, or a LinkedIn PDF.", href: "/sources", cta: "Add a source" },
    { n: "02", title: "Take a six-minute call", body: "Voice only, in your browser. Questions cite your files.", href: "/interviews/new", cta: "Start" },
    { n: "03", title: "Read your report", body: "Five scores, each with a quote and the gap.", href: "#", cta: null },
  ];
  return (
    <div className="mt-8 grid gap-3 md:grid-cols-3">
      {steps.map((s, i) => (
        <Card key={s.n} className="flex flex-col p-5">
          <MonoLabel>{s.n}</MonoLabel>
          <h3 className="mt-8 text-[0.9375rem] font-medium">{s.title}</h3>
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">{s.body}</p>
          {s.cta && (
            <Link
              href={s.href}
              className={buttonVariants({
                variant: i === 0 ? "default" : "outline",
                size: "sm",
                className: "mt-5 self-start",
              })}
            >
              {s.cta} <ArrowRight />
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const { empty } = await searchParams;

  if (empty) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${user.name}`}
          description="Your first interview takes about ten minutes, start to report."
        />
        <EmptyState />
      </>
    );
  }

  const done = interviews.filter((i) => i.status === "reported");
  const trend = [...done].reverse().map((i) => overall(i.scores));
  const latest = trend.at(-1) ?? 0;
  const minutes = Math.round(done.reduce((s, i) => s + i.durationSec, 0) / 60);
  const weak = weakest();
  const weakHistory = [...done].reverse().map((i) => ({ id: i.id, title: i.title, v: i.scores[weak] }));
  const lowestCount = done.filter((i) => DIMENSIONS.every((d) => i.scores[weak] <= i.scores[d])).length;
  const runnerUp = [...DIMENSIONS].filter((d) => d !== weak).sort((a, b) => average(a) - average(b))[0]!;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name}`}
        description={`${done.length} interviews · ${minutes} minutes practiced`}
        actions={
          <Link href="/interviews/new" className={buttonVariants({ shape: "soft" })}>
            <Plus /> New interview
          </Link>
        }
      />

      <div className="mt-8 grid gap-3 lg:grid-cols-5">
        {/* Next focus: what to do next time */}
        <Card className="flex flex-col p-5 lg:col-span-3">
          <MonoLabel>Next focus</MonoLabel>
          <h2 className="mt-3 text-[1.125rem] font-medium tracking-[-0.02em]">
            Three things to fix in your next call
          </h2>
          <ol className="mt-4 space-y-2.5">
            {report.nextFocus.map((f, i) => (
              <li key={f} className="grid grid-cols-[1.5rem_1fr] gap-2 text-[0.8125rem] leading-relaxed">
                <span className="font-mono text-[0.6875rem] text-muted-foreground">0{i + 1}</span>
                {f}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-2 lg:mt-auto lg:pt-6">
            <Link href={`/interviews/new?focus=${weak}`} className={buttonVariants({ size: "sm" })}>
              <RotateCcw /> Retest {DIMENSION_LABEL[weak].toLowerCase()}
            </Link>
            <Link href={`/interviews/${done[0]?.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Last report <ArrowUpRight />
            </Link>
          </div>
        </Card>

        {/* Weakest area: the dimension holding the score down */}
        <Card className="flex flex-col p-5 lg:col-span-2">
          <MonoLabel>Weakest area</MonoLabel>
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="text-[1.375rem] font-medium tracking-[-0.03em]">{DIMENSION_LABEL[weak]}</h2>
            <ScoreNumber value={average(weak)} className="text-[0.875rem]" />
          </div>
          <ScoreBar value={average(weak)} className="mt-3" />
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Your lowest score in {lowestCount} of {done.length} interviews. Next lowest is{" "}
            {DIMENSION_LABEL[runnerUp].toLowerCase()} at {average(runnerUp).toFixed(1)}.
          </p>
          <div className="mt-5 lg:mt-auto lg:pt-5">
            <MonoLabel>Last {weakHistory.length} interviews</MonoLabel>
            <ul className="mt-2 flex items-end gap-2" aria-label={`${DIMENSION_LABEL[weak]} over time`}>
              {weakHistory.map((h) => (
                <li key={h.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="flex h-12 w-full items-end overflow-hidden rounded-md bg-black/[0.04]">
                    <span
                      className="w-full rounded-md bg-foreground"
                      style={{ height: `${(h.v / 5) * 100}%` }}
                      title={`${h.title}: ${h.v}/5`}
                    />
                  </span>
                  <span className="font-mono text-[0.625rem] text-muted-foreground tabular-nums">{h.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        {/* Progress */}
        <Card className="lg:col-span-3">
          <CardHead title="Progress" hint="Average across all interviews" />
          <div className="grid gap-6 p-5 sm:grid-cols-[1fr_14rem]">
            <ul className="space-y-3">
              {DIMENSIONS.map((d) => (
                <li key={d} className="grid grid-cols-[6.5rem_1fr_2.75rem] items-center gap-3">
                  <span className={cn("font-mono text-[0.6875rem]", d === weak ? "text-foreground" : "text-muted-foreground")}>
                    {DIMENSION_LABEL[d]}
                  </span>
                  <ScoreBar value={average(d)} />
                  <ScoreNumber value={average(d)} className="text-right text-[0.6875rem]" />
                </li>
              ))}
            </ul>
            <div>
              <MonoLabel>Overall, last {trend.length}</MonoLabel>
              <Sparkline values={trend} className="mt-2 text-foreground" />
              <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                {trend[0]?.toFixed(1)} → <span className="text-foreground">{latest.toFixed(1)}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Sources */}
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
              {
                kind: "github" as const,
                name: "GitHub",
                meta: sources.github.connected ? `@${sources.github.login}` : "Connect to use your repos",
                on: sources.github.connected,
                cta: "Connect",
              },
              {
                kind: "resume" as const,
                name: "Resume",
                meta: sources.resume.uploaded ? `${sources.resume.file} · ${sources.resume.pages} pages` : "Not added",
                on: sources.resume.uploaded,
                cta: "Add",
              },
              {
                kind: "linkedin" as const,
                name: "LinkedIn",
                meta: "Add your “Save to PDF” export",
                on: sources.linkedin.uploaded,
                cta: "Add",
              },
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
                    {s.cta}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
