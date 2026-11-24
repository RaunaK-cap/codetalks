import multer from "multer";
import { badRequest } from "../lib/http-error";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/* Up to 4 LinkedIn screenshots, kept in memory only, never written to disk. */
export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, done) => {
    if (IMAGE_TYPES.has(file.mimetype)) done(null, true);
    else done(badRequest("invalid_upload", "Screenshots must be PNG, JPEG, or WebP."));
  },
}).array("screenshots", 4);
