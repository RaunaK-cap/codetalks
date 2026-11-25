import type { Request, Response } from "express";
import type { z } from "zod";
import type { ConnectGithubBody } from "@repo/contracts";
import { badRequest } from "../lib/http-error";
import { userIdOf } from "../middleware/require-auth";
import { attachLinkedin, connectGithub, getMe } from "../services/candidate.service";
import { listInterviews } from "../services/interview.service";

export async function show(req: Request, res: Response) {
  res.json(await getMe(userIdOf(req)));
}

export async function github(req: Request<{}, {}, z.infer<typeof ConnectGithubBody>>, res: Response) {
  res.json(await connectGithub(userIdOf(req), req.body.github));
}

export async function linkedin(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw badRequest("invalid_upload", "Attach at least one screenshot as `screenshots`.");
  const screenshots = files.map((f) => ({ mime: f.mimetype, data: f.buffer }));
  res.json(await attachLinkedin(userIdOf(req), screenshots));
}

export async function interviews(req: Request, res: Response) {
  res.json(await listInterviews(userIdOf(req)));
}
