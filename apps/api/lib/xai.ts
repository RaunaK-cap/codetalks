import OpenAI from "openai";
import { z } from "zod";
import { env } from "./env";
import { upstream } from "./http-error";

/*
 * xAI (Grok) through its OpenAI-compatible Responses API.
 * One job: send a prompt, get back JSON that matches a Zod schema.
 */

const client = new OpenAI({
  apiKey: env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
  timeout: 120_000,
  maxRetries: 2,
});

export type Part =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "high" | "low" | "auto" };

export function imagePart(mime: string, data: Buffer): Part {
  return { type: "input_image", image_url: `data:${mime};base64,${data.toString("base64")}`, detail: "high" };
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
  const { name, schema, system, content, model = env.XAI_TEXT_MODEL } = options;

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: typeof content === "string" ? [{ type: "input_text", text: content }] : content },
    ],
    text: { format: { type: "json_schema", name, schema: jsonSchema(schema), strict: false } },
  });

  let data: unknown;
  try {
    data = JSON.parse(response.output_text);
  } catch {
    throw upstream("llm_bad_output", `${name}: model did not return JSON`);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw upstream("llm_bad_output", `${name}: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
