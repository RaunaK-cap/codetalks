import { Router } from "express";
import { enabledProviders } from "../lib/auth";
import { requireAuth } from "../middleware/require-auth";
import { interviewsRouter } from "./interviews.routes";
import { meRouter } from "./me.routes";

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Public: which social sign-in buttons to enable on the auth page.
api.get("/providers", (_req, res) => {
  res.json(enabledProviders);
});

api.use("/me", requireAuth, meRouter);
api.use("/interviews", requireAuth, interviewsRouter);
