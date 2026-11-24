import { env } from "../lib/env";
import { tooMany } from "../lib/http-error";
import { prisma } from "../lib/prisma";

/*
 * There is no login yet, so anyone with the URL could spend voice minutes.
 * Two caps, both counted from the database so they survive restarts:
 * calls per IP per day, and total call minutes per day.
 */

const MAX_CALL_MS = 6 * 60_000;

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function assertCallBudget(ip: string): Promise<void> {
  const today = await prisma.interview.findMany({
    where: { startedAt: { gte: startOfUtcDay() } },
    select: { clientIp: true, startedAt: true, endedAt: true },
  });

  const fromIp = today.filter((i) => i.clientIp === ip).length;
  if (fromIp >= env.CALLS_PER_IP_PER_DAY) {
    throw tooMany("daily_call_limit", `You can take ${env.CALLS_PER_IP_PER_DAY} interviews a day. Come back tomorrow.`);
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
