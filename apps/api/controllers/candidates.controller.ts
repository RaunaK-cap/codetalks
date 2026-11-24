import type { Request, Response } from "express";
import type { z } from "zod";
import type { ConnectGithubBody } from "@repo/contracts";
import { badRequest } from "../lib/http-error";
import { attachLinkedin, connectGithub, getCandidate } from "../services/candidate.service";
import { listInterviews } from "../services/interview.service";

type Id = { id: string };

export async function connect(req: Request<{}, {}, z.infer<typeof ConnectGithubBody>>, res: Response) {
  res.status(201).json(await connectGithub(req.body.github));
}

export async function show(req: Request<Id>, res: Response) {
  res.json(await getCandidate(req.params.id));
}

export async function addLinkedin(req: Request<Id>, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw badRequest("invalid_upload", "Attach at least one screenshot as `screenshots`.");
  const screenshots = files.map((f) => ({ mime: f.mimetype, data: f.buffer }));
  res.json(await attachLinkedin(req.params.id, screenshots));
}

export async function interviews(req: Request<Id>, res: Response) {
  await getCandidate(req.params.id);
  res.json(await listInterviews(req.params.id));
}
