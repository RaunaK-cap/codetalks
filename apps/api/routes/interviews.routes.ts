import { Router } from "express";
import { AppendLineBody, CreateInterviewBody } from "@repo/contracts";
import * as interviews from "../controllers/interviews.controller";
import { callLimit, prepareLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";

export const interviewsRouter = Router();

interviewsRouter.post("/", prepareLimit, validateBody(CreateInterviewBody), interviews.create);
interviewsRouter.get("/:id", interviews.show);
interviewsRouter.post("/:id/call", callLimit, interviews.call);
interviewsRouter.post("/:id/lines", validateBody(AppendLineBody), interviews.addLine);
interviewsRouter.post("/:id/end", interviews.end);
