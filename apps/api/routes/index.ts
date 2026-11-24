import { Router } from "express";
import { candidatesRouter } from "./candidates.routes";
import { interviewsRouter } from "./interviews.routes";

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true });
});
api.use("/candidates", candidatesRouter);
api.use("/interviews", interviewsRouter);
