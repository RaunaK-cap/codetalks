import { Router } from "express";
import { ConnectGithubBody } from "@repo/contracts";
import * as candidates from "../controllers/candidates.controller";
import { githubLimit, linkedinLimit } from "../middleware/rate-limit";
import { screenshotUpload } from "../middleware/upload";
import { validateBody } from "../middleware/validate";

export const candidatesRouter = Router();

candidatesRouter.post("/", githubLimit, validateBody(ConnectGithubBody), candidates.connect);
candidatesRouter.get("/:id", candidates.show);
candidatesRouter.post("/:id/linkedin", linkedinLimit, screenshotUpload, candidates.addLinkedin);
candidatesRouter.get("/:id/interviews", candidates.interviews);
