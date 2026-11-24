"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/app/card";
import { ScorePips, ScoreNumber, SourceIcon } from "@/components/app/score";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIMENSIONS, DIMENSION_LABEL, ROLES, formatDate, formatDuration, interviews, overall } from "@/lib/mock";

const ROLE_ITEMS = [{ value: "all", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: r }))];

export function HistoryList() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | null>("all");

  const rows = useMemo(
    () =>
      interviews.filter(
        (i) =>
          (role === "all" || i.role === role) &&
          `${i.title} ${i.source.label}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, role],
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-black/35" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search interviews"
            aria-label="Search interviews"
            className="pl-9"
          />
        </div>
        <Select items={ROLE_ITEMS} value={role} onValueChange={(v) => setRole(v as string)}>
          <SelectTrigger
            aria-label="Filter by role"
            className="h-9 w-full rounded-full border-black/10 bg-white px-4 font-mono text-[0.75rem] sm:w-40"
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
        <div className="hidden grid-cols-[1fr_6rem_9rem_4.5rem_4.5rem_5rem_1rem] gap-4 border-b border-black/[0.06] px-5 py-3 font-mono text-[0.625rem] text-muted-foreground uppercase md:grid">
          <span>Interview</span>
          <span>Role</span>
          <span>Dimensions</span>
          <span>Length</span>
          <span>Date</span>
          <span className="text-right">Score</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center font-mono text-[0.75rem] text-muted-foreground">
            No interviews match that.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {rows.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/interviews/${i.id}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-black/[0.02] md:grid-cols-[1fr_6rem_9rem_4.5rem_4.5rem_5rem_1rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/[0.08]">
                      <SourceIcon kind={i.source.kind} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] font-medium">{i.title}</span>
                      <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                        {i.source.label}
                        <span className="md:hidden"> · {i.role} · {formatDate(i.date)}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden font-mono text-[0.6875rem] text-muted-foreground md:block">{i.role}</span>
                  <span
                    className="hidden gap-1.5 md:flex"
                    aria-label={DIMENSIONS.map((d) => `${DIMENSION_LABEL[d]} ${i.scores[d]} of 5`).join(", ")}
                  >
                    {DIMENSIONS.map((d) => (
                      <span key={d} className="flex h-4 w-1.5 items-end overflow-hidden rounded-full bg-black/[0.06]">
                        <span className="w-full rounded-full bg-foreground" style={{ height: `${(i.scores[d] / 5) * 100}%` }} />
                      </span>
                    ))}
                  </span>
                  <span className="hidden font-mono text-[0.6875rem] text-muted-foreground tabular-nums md:block">
                    {formatDuration(i.durationSec)}
                  </span>
                  <span className="hidden font-mono text-[0.6875rem] text-muted-foreground md:block">{formatDate(i.date)}</span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="hidden sm:inline-flex md:hidden"><ScorePips value={Math.round(overall(i.scores))} /></span>
                    <ScoreNumber value={overall(i.scores)} className="text-[0.75rem]" />
                  </span>
                  <ChevronRight className="hidden size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
