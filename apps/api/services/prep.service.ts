import { FactSheet, Plan, type GithubProfile, type GithubRepo, type LinkedinProfile, type Role } from "@repo/contracts";
import { factSheetSystem, factsForPlanner, planSystem } from "../lib/prompts";
import { untrusted } from "../lib/untrusted";
import { generateObject } from "../lib/xai";
import type { RepoMaterial } from "./github.service";

/* Turns raw sources into a fact sheet, then the fact sheet into a question plan. */

const FactSheetDraft = FactSheet.omit({ codeSamples: true });

export async function buildFactSheet(input: {
  role: Role;
  github: GithubProfile;
  repo: GithubRepo;
  material: RepoMaterial;
  linkedin: LinkedinProfile | null;
}): Promise<FactSheet> {
  const { role, github, repo, material, linkedin } = input;

  const profile = [
    `GitHub: @${github.login}${github.name ? ` (${github.name})` : ""}`,
    github.bio && `Bio: ${github.bio}`,
    `Public repos: ${github.publicRepos}. Other recent repos: ${github.repos
      .filter((r) => r.name !== repo.name && !r.isFork)
      .slice(0, 8)
      .map((r) => `${r.name}${r.language ? ` (${r.language})` : ""}`)
      .join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const sections = [
    untrusted("github_profile", profile),
    untrusted(
      "repo",
      `${repo.fullName}: ${repo.description ?? "no description"}\nLanguages: ${material.languages.join(", ")}\nStars: ${repo.stars}`,
    ),
    material.readme ? untrusted("readme", material.readme, 10_000) : null,
    ...material.files.map((f) => untrusted(`code:${f.path}`, f.excerpt)),
    linkedin ? untrusted("linkedin", JSON.stringify(linkedin), 6_000) : null,
  ].filter((s) => s !== null);

  const draft = await generateObject({
    name: "fact_sheet",
    schema: FactSheetDraft,
    system: factSheetSystem(role),
    content: sections.join("\n\n"),
  });

  return { ...draft, codeSamples: material.files };
}

export async function writePlan(input: { role: Role; repo: GithubRepo; factSheet: FactSheet }): Promise<Plan> {
  const { role, repo, factSheet } = input;
  const plan = await generateObject({
    name: "question_plan",
    schema: Plan,
    system: planSystem(role),
    content: [
      `Project: ${repo.fullName}`,
      untrusted("fact_sheet", factsForPlanner(factSheet)),
      untrusted(
        "code_paths",
        factSheet.codeSamples.map((c) => c.path).join("\n") || "none",
      ),
    ].join("\n\n"),
  });

  // Keep only fact ids that exist, so the report can link questions to evidence.
  const known = new Set(factSheet.facts.map((f) => f.id));
  return {
    ...plan,
    questions: plan.questions.map((q) => ({ ...q, factIds: q.factIds.filter((id) => known.has(id)) })),
  };
}
