import type { Request, Response } from "express";
import type { z } from "zod";
import type { AppendLineBody, CreateInterviewBody } from "@repo/contracts";
import { appendLine, createInterview, endInterview, getInterview, startCall } from "../services/interview.service";

type Id = { id: string };

const ipOf = (req: Request) => req.ip ?? "unknown";

export async function create(req: Request<{}, {}, z.infer<typeof CreateInterviewBody>>, res: Response) {
  res.status(202).json(await createInterview({ ...req.body, ip: ipOf(req) }));
}

export async function show(req: Request<Id>, res: Response) {
  res.json(await getInterview(req.params.id));
}

export async function call(req: Request<Id>, res: Response) {
  res.json(await startCall(req.params.id, ipOf(req)));
}

export async function addLine(req: Request<Id, {}, z.infer<typeof AppendLineBody>>, res: Response) {
  await appendLine(req.params.id, req.body);
  res.status(204).end();
}

export async function end(req: Request<Id>, res: Response) {
  res.json(await endInterview(req.params.id));
}
