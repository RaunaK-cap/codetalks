import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Resolve against this package even when imported from an app with a different cwd.
config({
  path: [".env.local", ".env"].map((name) => fileURLToPath(new URL(name, import.meta.url))),
  quiet: true,
});
