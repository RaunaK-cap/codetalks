import { rateLimit } from "express-rate-limit";
import { tooMany } from "../lib/http-error";

/*
 * Per-IP request limits, kept in memory (fine for one server instance).
 * Cheap reads get a loose limit; routes that cost money (GitHub, Grok, Fish) get tight ones.
 * The daily voice budget in services/budget.service.ts is a separate, stricter cap on calls.
 */

const MINUTE = 60_000;

function limiter(name: string, limit: number, windowMs: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8", // RateLimit + RateLimit-Policy headers
    legacyHeaders: false,
    handler: (_req, _res, next, options) => {
      const minutes = Math.ceil(options.windowMs / MINUTE);
      next(tooMany("rate_limited", `Too many ${name} requests. Try again in ${minutes} min.`));
    },
  });
}

/** Everything under /api: polling, lines, reads. */
export const apiLimit = limiter("API", 300, 5 * MINUTE);

/** POST /candidates: hits the GitHub API (60 req/hour without a token). */
export const githubLimit = limiter("GitHub lookup", 10, 10 * MINUTE);

/** POST /candidates/:id/linkedin: an LLM vision call on up to 4 images. */
export const linkedinLimit = limiter("LinkedIn upload", 5, 30 * MINUTE);

/** POST /interviews: GitHub reads plus two Grok calls. */
export const prepareLimit = limiter("interview setup", 6, 30 * MINUTE);

/** POST /interviews/:id/call: creates a paid voice session. */
export const callLimit = limiter("call", 5, 30 * MINUTE);
