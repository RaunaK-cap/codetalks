import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiLimit } from "./middleware/rate-limit";
import { api } from "./routes";

export const app = express();

app.set("trust proxy", env.TRUST_PROXY); // so req.ip is the real client behind Next.js / Render
app.disable("x-powered-by");
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

// API responses are per-user. Never let a CDN or browser cache them (Vercel honours upstream cache headers).
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

// Better Auth reads the raw request body, so it must come before express.json().
app.all("/api/auth/*splat", apiLimit, toNodeHandler(auth));

app.use(express.json({ limit: "100kb" }));
app.use("/api", apiLimit, api);

app.use(notFoundHandler);
app.use(errorHandler);
