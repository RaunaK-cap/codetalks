import { Report, type Line, type Plan } from "@repo/contracts";
import { planForGrader, reportSystem } from "../lib/prompts";
import { untrusted } from "../lib/untrusted";
import { generateObject } from "../lib/llm";

/* Grades the stored transcript. The voice model has no say in this. */
export async function scoreInterview(input: { plan: Plan; lines: Line[] }): Promise<Report> {
  const transcript = input.lines
    .map((l) => `${l.speaker === "candidate" ? "CANDIDATE" : "INTERVIEWER"}: ${l.text}`)
    .join("\n");

  return generateObject({
    name: "interview_report",
    schema: Report,
    system: reportSystem(),
    content: [`Planned questions:\n${planForGrader(input.plan)}`, untrusted("transcript", transcript, 40_000)].join(
      "\n\n",
    ),
  });
}
