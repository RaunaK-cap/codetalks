import type { RequestHandler } from "express";
import type { z } from "zod";

/* Parses req.body with a Zod schema. Bad input becomes a 400 in the error handler. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
