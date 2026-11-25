import { z } from "zod";

// Empty strings in .env count as "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());
const required = z.string().min(1, "is required");

const Env = z.object({
  PORT: z.coerce.number().int().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: required,
  GITHUB_TOKEN: optional(z.string()),
  GOOGLE_API_KEY: required,
  LLM_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta/openai/"),
  LLM_TEXT_MODEL: z.string().default("gemini-3.5-flash"),
  LLM_VISION_MODEL: z.string().default("gemini-3.1-flash-lite"),
  FISH_API_KEY: required,
  FISH_AGENT_ID: required,
  CALLS_PER_IP_PER_DAY: z.coerce.number().int().positive().default(3),
  CALL_MINUTES_PER_DAY: z.coerce.number().int().positive().default(60),
});

const parsed = Env.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  console.error(`Invalid environment. Check apps/api/.env:\n${lines.join("\n")}`);
  process.exit(1);
}

export const env = parsed.data;
