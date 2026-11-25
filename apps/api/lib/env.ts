import { z } from "zod";

// Empty strings in .env count as "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());
const required = z.string().min(1, "is required");

const Env = z.object({
  PORT: z.coerce.number().int().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  /** Proxies between the client and Express (Next.js rewrite locally; + Render's load balancer in production). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  // Better Auth. The web app forwards /api/* here, so auth lives on the web origin.
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  BETTER_AUTH_URL: optional(z.string()),
  GITHUB_CLIENT_ID: optional(z.string()),
  GITHUB_CLIENT_SECRET: optional(z.string()),
  GOOGLE_CLIENT_ID: optional(z.string()),
  GOOGLE_CLIENT_SECRET: optional(z.string()),

  DATABASE_URL: required,
  GITHUB_TOKEN: optional(z.string()),
  GOOGLE_API_KEY: required,
  LLM_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta/openai/"),
  LLM_TEXT_MODEL: z.string().default("gemini-3.5-flash"),
  LLM_VISION_MODEL: z.string().default("gemini-3.1-flash-lite"),
  LLM_REASONING_EFFORT: z.enum(["low", "medium", "high"]).default("low"),
  FISH_API_KEY: required,
  FISH_AGENT_ID: required,
  CALLS_PER_USER_PER_DAY: z.coerce.number().int().positive().default(3),
  CALL_MINUTES_PER_DAY: z.coerce.number().int().positive().default(60),
});

const parsed = Env.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  console.error(`Invalid environment. Check apps/api/.env:\n${lines.join("\n")}`);
  process.exit(1);
}

export const env = parsed.data;
