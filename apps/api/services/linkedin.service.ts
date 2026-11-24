import { LinkedinProfile } from "@repo/contracts";
import { env } from "../lib/env";
import { LINKEDIN_SYSTEM } from "../lib/prompts";
import { generateObject, imagePart, type Part } from "../lib/xai";

export type Screenshot = { mime: string; data: Buffer };

/* Reads LinkedIn profile screenshots with a Grok vision model. */
export async function extractLinkedinProfile(screenshots: Screenshot[]): Promise<LinkedinProfile> {
  const content: Part[] = [
    ...screenshots.map((s) => imagePart(s.mime, s.data)),
    { type: "input_text", text: "Extract the LinkedIn profile shown in these screenshots." },
  ];
  return generateObject({
    name: "linkedin_profile",
    schema: LinkedinProfile,
    system: LINKEDIN_SYSTEM,
    content,
    model: env.XAI_VISION_MODEL,
  });
}
