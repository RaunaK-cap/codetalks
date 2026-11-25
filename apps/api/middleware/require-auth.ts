import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { HttpError } from "../lib/http-error";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireAuth: the signed-in user's id. */
      userId?: string;
    }
  }
}

/* Rejects requests without a valid Better Auth session (401). */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) throw new HttpError(401, "unauthorized", "Please sign in.");
  req.userId = session.user.id;
  next();
};

/** The user id inside a route behind requireAuth. */
export function userIdOf(req: { userId?: string }): string {
  if (!req.userId) throw new HttpError(401, "unauthorized", "Please sign in.");
  return req.userId;
}
