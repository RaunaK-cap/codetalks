import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Play, RotateCcw, Share2 } from "lucide-react";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { ScoreBar, ScoreNumber, ScorePips, SourceIcon } from "@/components/app/score";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  formatDate,
  formatDuration,
  getInterview,
  overall,
  report,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Report · CodeTalk" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interview = getInterview(id);
  const total = overall(interview.scores);
  const weakDim = [...DIMENSIONS].sort((a, b) => interview.scores[a] - interview.scores[b])[0]!;

  return (
    <>
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> History
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
            <SourceIcon kind={interview.source.kind} className="size-3" />
            {interview.source.label} · {interview.role} · {formatDate(interview.date)} ·{" "}
            {formatDuration(interview.durationSec)} min
          </p>
          <h1 className="mt-2 text-[1.5rem] leading-tight font-medium tracking-[-0.03em]">
            Interview report: {interview.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" shape="soft">
            <Share2 /> Share
          </Button>
          <Link
            href={`/interviews/new?source=${interview.source.kind === "github" ? `repo:${interview.title}` : "resume"}&focus=${weakDim}`}
            className={buttonVariants({ shape: "soft" })}
          >
            <RotateCcw /> Retest {DIMENSION_LABEL[weakDim].toLowerCase()}
          </Link>
        </div>
      </div>

      {/* Score overview */}
      <div className="mt-6 grid gap-3 lg:grid-cols-[16rem_1fr]">
        <Card className="flex flex-col justify-between p-5">
          <MonoLabel>Overall</MonoLabel>
          <p className="mt-6 text-[3rem] leading-none font-medium tracking-[-0.05em] tabular-nums">
            {total.toFixed(1)}
            <span className="text-[1.25rem] text-muted-foreground">/5</span>
          </p>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">{report.summary}</p>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {DIMENSIONS.map((d) => {
            const v = interview.scores[d];
            return (
              <Card key={d} className={cn("flex flex-col p-4", d === weakDim && "border-foreground/30")}>
                <MonoLabel>{DIMENSION_LABEL[d]}</MonoLabel>
                <p className="mt-3 text-[1.5rem] leading-none font-medium tabular-nums">
                  {v}
                  <span className="text-[0.875rem] text-muted-foreground">/5</span>
                </p>
                <ScoreBar value={v} className="mt-4" />
                {d === weakDim && (
                  <span className="mt-2 font-mono text-[0.625rem] text-muted-foreground">Weakest</span>
                )}
              </Card>
            );
          })}
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

      {/* Questions and transcript */}
      <Tabs defaultValue="questions" className="mt-8">
        <TabsList className="h-9 rounded-full bg-black/[0.04] p-1">
          <TabsTrigger value="questions" className="rounded-full px-3.5 font-mono text-[0.6875rem]">
            Questions ({report.questions.length})
          </TabsTrigger>
          <TabsTrigger value="transcript" className="rounded-full px-3.5 font-mono text-[0.6875rem]">
            Transcript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-3 grid gap-3">
          {report.questions.map((q, i) => (
            <Card key={q.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
                  <span className="text-foreground">Q{i + 1}</span> · {q.at} ·
                  <span className="rounded-md border border-black/[0.08] px-1.5 py-0.5">{q.cite}</span>
                </p>
                <span className="flex items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
                  {DIMENSION_LABEL[q.dimension]} <ScorePips value={q.score} />
                </span>
              </div>
              <h3 className="mt-3 text-[0.9375rem] font-medium tracking-[-0.01em]">{q.ask}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-black/[0.03] p-3.5">
                  <MonoLabel>You said</MonoLabel>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed">“{q.youSaid}”</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground hover:text-foreground"
                  >
                    <Play className="size-3" /> Play this moment
                  </button>
                </div>
                <div className="rounded-xl border border-black/[0.07] p-3.5">
                  <MonoLabel>A strong answer mentions</MonoLabel>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {q.strongMentions.map((m) => (
                      <li key={m} className="rounded-full border border-black/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem]">
                        {m}
                      </li>
                    ))}
                  </ul>
                  {q.missing.length > 0 && (
                    <>
                      <MonoLabel className="mt-3">Missing</MonoLabel>
                      <ul className="mt-1.5 space-y-1">
                        {q.missing.map((m) => (
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
          ))}
        </TabsContent>

        <TabsContent value="transcript" className="mt-3">
          <Card>
            <CardHead title="Full transcript" hint="Saved line by line during the call" />
            <ol className="space-y-4 p-5">
              {report.transcript.map((l) => (
                <li key={l.at} className="grid grid-cols-[3rem_1fr] gap-3">
                  <span className="pt-0.5 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">{l.at}</span>
                  <div>
                    <p className="font-mono text-[0.625rem] text-muted-foreground uppercase">
                      {l.who === "interviewer" ? "Interviewer" : "You"}
                    </p>
                    <p className={cn("mt-0.5 text-[0.8125rem] leading-relaxed", l.who === "interviewer" && "text-foreground/70")}>
                      {l.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center font-mono text-[0.6875rem] text-muted-foreground">
        Overall <ScoreNumber value={total} /> · scored from the saved transcript, not by the voice model
      </p>
    </>
  );
}
