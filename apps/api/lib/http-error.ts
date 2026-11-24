/* An error the client is allowed to see. Anything else becomes a generic 500. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (code: string, message: string) => new HttpError(400, code, message);
export const notFound = (what: string) => new HttpError(404, "not_found", `${what} not found`);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);
export const tooMany = (code: string, message: string) => new HttpError(429, code, message);
export const upstream = (code: string, message: string) => new HttpError(502, code, message);
