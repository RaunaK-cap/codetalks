import cors from "cors";
import express from "express";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiLimit } from "./middleware/rate-limit";
import { api } from "./routes";

export const app = express();

app.set("trust proxy", 1); // Render sits behind one proxy; req.ip is the real client.
app.disable("x-powered-by");
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiLimit, api);

app.use(notFoundHandler);
app.use(errorHandler);
