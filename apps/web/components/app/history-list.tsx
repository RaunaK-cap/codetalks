"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronRight, Search } from "lucide-react";
import type { InterviewSummary } from "@repo/contracts";
import { Card } from "@/components/app/card";
import { ScoreNumber, SourceIcon } from "@/components/app/score";
import { ConnectFirst, Empty, ErrorNote, LoadingCards } from "@/components/app/states";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/me";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  ROLES,
  ROLE_LABEL,
  STATUS_LABEL,
  average,
  formatDate,
  formatDuration,
  reposTitle,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const ROLE_ITEMS = [{ value: "all", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))];

function Row({ i }: { i: InterviewSummary }) {
  const score = i.scores ? average(i.scores.map((s) => s.score)) : null;
  const length = formatDuration(i.startedAt, i.endedAt);
  const href = i.status === "ready" || i.status === "live" ? `/interviews/${i.id}/call` : `/interviews/${i.id}`;

  return (
    <Link
      href={href}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-foreground/[0.02] md:grid-cols-[1fr_6rem_9rem_4.5rem_4.5rem_5rem_1rem]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-foreground/[0.08]">
          <SourceIcon kind="github" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.8125rem] font-medium">{reposTitle(i.repos)}</span>
          <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
            {i.repos.length > 1 ? `${i.repos.length} latest projects` : i.repos[0]}
            <span className="md:hidden">
              {" "}
              · {ROLE_LABEL[i.role]} · {formatDate(i.createdAt)}
            </span>
          </span>
        </span>
      </span>
      <span className="hidden font-mono text-[0.6875rem] text-muted-foreground md:block">{ROLE_LABEL[i.role]}</span>
      <span className="hidden gap-1.5 md:flex">
        {i.scores ? (
          DIMENSIONS.map((d) => {
            const v = i.scores!.find((s) => s.dimension === d)?.score ?? 0;
            return (
              <span
                key={d}
                title={`${DIMENSION_LABEL[d]} ${v}/5`}
                className="flex h-4 w-1.5 items-end overflow-hidden rounded-full bg-foreground/[0.06]"
              >
                <span className="w-full rounded-full bg-foreground" style={{ height: `${(v / 5) * 100}%` }} />
              </span>
            );
          })
        ) : (
          <span className="font-mono text-[0.6875rem] text-muted-foreground">—</span>
        )}
      </span>
      <span className="hidden font-mono text-[0.6875rem] text-muted-foreground tabular-nums md:block">{length ?? "—"}</span>
      <span className="hidden font-mono text-[0.6875rem] text-muted-foreground md:block">{formatDate(i.createdAt)}</span>
      <span className="flex items-center justify-end gap-2">
        {score !== null ? (
          <ScoreNumber value={score} className="text-[0.75rem]" />
        ) : (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[0.625rem]",
              i.status === "failed" || i.status === "report_failed"
                ? "border-destructive/30 text-destructive"
                : "border-foreground/[0.1] text-muted-foreground",
            )}
          >
            {STATUS_LABEL[i.status]}
          </span>
        )}
      </span>
      <ChevronRight className="hidden size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
    </Link>
  );
}

export function HistoryList() {
  const { candidate, isLoading } = useMe();
  const list = useSWR(candidate ? "interviews" : null, api.listInterviews);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | null>("all");

  const rows = useMemo(
    () =>
      (list.data ?? []).filter(
        (i) => (role === "all" || i.role === role) &&
          i.repos.join(" ").toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [list.data, query, role],
  );

  if (isLoading) return <LoadingCards count={1} />;
  if (!candidate) return <ConnectFirst />;
  if (list.error) return <ErrorNote message={errorMessage(list.error)} onRetry={() => list.mutate()} />;
  if (list.isLoading) return <LoadingCards count={1} />;
  if (!list.data?.length) {
    return (
      <Empty
        className="mt-8 py-16"
        title="No interviews yet"
        body="Every interview you take is saved here with its report."
        action={{ label: "Start your first interview", href: "/interviews/new" }}
      />
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-foreground/35" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by repo"
            aria-label="Search by repo"
            className="pl-9"
          />
        </div>
        <Select items={ROLE_ITEMS} value={role} onValueChange={(v) => setRole(v as string)}>
          <SelectTrigger
            aria-label="Filter by role"
            className="h-9 w-full rounded-full border-foreground/10 bg-card px-4 font-mono text-[0.75rem] sm:w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_ITEMS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="font-mono text-[0.75rem]">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-3 overflow-hidden">
        <div className="hidden grid-cols-[1fr_6rem_9rem_4.5rem_4.5rem_5rem_1rem] gap-4 border-b border-foreground/[0.06] px-5 py-3 font-mono text-[0.625rem] text-muted-foreground uppercase md:grid">
          <span>Interview</span>
          <span>Role</span>
          <span>Dimensions</span>
          <span>Length</span>
          <span>Date</span>
          <span className="text-right">Score</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center font-mono text-[0.75rem] text-muted-foreground">No interviews match that.</p>
        ) : (
          <ul className="divide-y divide-foreground/[0.05]">
            {rows.map((i) => (
              <li key={i.id}>
                <Row i={i} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
