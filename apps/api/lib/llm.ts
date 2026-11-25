import OpenAI from "openai";
import { z } from "zod";
import { env } from "./env";
import { upstream } from "./http-error";

/*
 * The text/vision LLM, through the OpenAI-compatible Chat Completions API.
 * Defaults to Google Gemini; any OpenAI-compatible provider works by changing LLM_BASE_URL.
 * One job: send a prompt, get back JSON that matches a Zod schema.
 */

const client = new OpenAI({
  apiKey: env.GOOGLE_API_KEY,
  baseURL: env.LLM_BASE_URL,
  timeout: 120_000,
  maxRetries: 2,
});

export type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function imagePart(mime: string, data: Buffer): Part {
  return { type: "image_url", image_url: { url: `data:${mime};base64,${data.toString("base64")}` } };
}

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

export async function generateObject<S extends z.ZodType>(options: {
  name: string;
  schema: S;
  system: string;
  content: string | Part[];
  model?: string;
}): Promise<z.infer<S>> {
  const { name, schema, system, content, model = env.LLM_TEXT_MODEL } = options;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
    response_format: { type: "json_schema", json_schema: { name, schema: jsonSchema(schema) } },
  });

  const text = completion.choices[0]?.message.content;
  if (!text) throw upstream("llm_bad_output", `${name}: model returned no content`);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw upstream("llm_bad_output", `${name}: model did not return JSON`);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw upstream("llm_bad_output", `${name}: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
