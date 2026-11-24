import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError, z } from "zod";
import { HttpError } from "../lib/http-error";

/* Every error leaves as { error: { code, message } }. Unknown errors are logged, not exposed. */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "invalid_request", message: z.prettifyError(error) } });
    return;
  }
  if (error instanceof MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Each screenshot must be under 5 MB." : error.message;
    res.status(400).json({ error: { code: "invalid_upload", message } });
    return;
  }
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "invalid_json", message: "Request body is not valid JSON." } });
    return;
  }

  console.error(`${req.method} ${req.originalUrl} failed:`, error);
  res.status(500).json({ error: { code: "internal", message: "Something went wrong." } });
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "not_found", message: `No route for ${req.method} ${req.path}` } });
};
