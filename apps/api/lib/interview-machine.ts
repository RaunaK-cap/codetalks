import type { InterviewStatus } from "@repo/contracts";
import { conflict } from "./http-error";

/*
 * Allowed status changes for an interview. Pure: no I/O.
 *
 *   preparing → ready → live → finishing → reported
 *       │         │                  └────→ report_failed (transcript kept)
 *       └─────────┴──→ failed
 */
const NEXT: Record<InterviewStatus, readonly InterviewStatus[]> = {
  preparing: ["ready", "failed"],
  ready: ["live", "failed"],
  live: ["finishing"],
  finishing: ["reported", "report_failed"],
  reported: [],
  report_failed: [],
  failed: [],
};

export function canMove(from: InterviewStatus, to: InterviewStatus): boolean {
  return NEXT[from].includes(to);
}

export function assertMove(from: InterviewStatus, to: InterviewStatus): void {
  if (!canMove(from, to)) {
    throw conflict("invalid_transition", `Interview is ${from}; it cannot become ${to}.`);
  }
}

export const isTerminal = (status: InterviewStatus) => NEXT[status].length === 0;
