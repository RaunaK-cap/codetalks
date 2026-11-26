import { env } from "../lib/env";
import { tooMany } from "../lib/http-error";
import { prisma } from "@repo/db";

/*
 * Voice minutes cost money. Two caps, both counted from the database so they survive restarts:
 * calls per user per day, and total call minutes per day across everyone.
 */

const MAX_CALL_MS = 5 * 60_000;

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function assertCallBudget(userId: string): Promise<void> {
  const today = await prisma.interview.findMany({
    where: { startedAt: { gte: startOfUtcDay() } },
    select: { startedAt: true, endedAt: true, candidate: { select: { userId: true } } },
  });

  const mine = today.filter((i) => i.candidate.userId === userId).length;
  if (mine >= env.CALLS_PER_USER_PER_DAY) {
    throw tooMany("daily_call_limit", `You can take ${env.CALLS_PER_USER_PER_DAY} interviews a day. Come back tomorrow.`);
  }

  const now = Date.now();
  const usedMs = today.reduce((sum, i) => {
    const start = i.startedAt!.getTime();
    const end = i.endedAt?.getTime() ?? Math.min(now, start + MAX_CALL_MS);
    return sum + (end - start);
  }, 0);
  if (usedMs + MAX_CALL_MS > env.CALL_MINUTES_PER_DAY * 60_000) {
    throw tooMany("daily_minutes_used", "Today's interview minutes are used up. Try again tomorrow.");
  }
}
