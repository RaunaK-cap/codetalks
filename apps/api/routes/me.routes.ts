import { Router } from "express";
import { ConnectGithubBody } from "@repo/contracts";
import * as me from "../controllers/me.controller";
import { githubLimit, linkedinLimit } from "../middleware/rate-limit";
import { screenshotUpload } from "../middleware/upload";
import { validateBody } from "../middleware/validate";

/* The signed-in user's own profile. Mounted behind requireAuth. */
export const meRouter = Router();

meRouter.get("/", me.show);
meRouter.post("/github", githubLimit, validateBody(ConnectGithubBody), me.github);
meRouter.post("/linkedin", linkedinLimit, screenshotUpload, me.linkedin);
meRouter.get("/interviews", me.interviews);
