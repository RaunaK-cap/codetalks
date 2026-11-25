import { FactSheet, Plan, type GithubProfile, type LinkedinProfile, type Role } from "@repo/contracts";
import { factSheetSystem, factsForPlanner, planSystem } from "../lib/prompts";
import { untrusted } from "../lib/untrusted";
import { generateObject } from "../lib/llm";
import type { RepoMaterial } from "./github.service";

/* Turns raw sources into a fact sheet, then the fact sheet into a question plan. */

const FactSheetDraft = FactSheet.omit({ codeSamples: true });

function profileText(github: GithubProfile, covered: Set<string>): string {
  const others = github.repos
    .filter((r) => !r.isFork && !covered.has(r.fullName))
    .slice(0, 8)
    .map((r) => `${r.name}${r.language ? ` (${r.language})` : ""}`)
    .join(", ");
  return [
    `GitHub: @${github.login}${github.name ? ` (${github.name})` : ""}`,
    github.bio && `Bio: ${github.bio}`,
    github.company && `Company: ${github.company}`,
    `Public repos: ${github.publicRepos}. Followers: ${github.followers}. On GitHub since ${github.createdAt.slice(0, 4)}.`,
    others && `Other repos: ${others}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function repoSections(m: RepoMaterial, readmeChars: number): string[] {
  const { repo } = m;
  return [
    untrusted(
      `repo:${repo.fullName}`,
      [
        `${repo.fullName}: ${repo.description ?? "no description"}`,
        `Languages: ${m.languages.join(", ") || "unknown"}. Stars: ${repo.stars}. Last push: ${repo.pushedAt.slice(0, 10)}.`,
      ].join("\n"),
    ),
    m.readme ? untrusted(`readme:${repo.fullName}`, m.readme, readmeChars) : untrusted(`readme:${repo.fullName}`, "(no README)"),
    ...m.files.map((f) => untrusted(`code:${repo.fullName}/${f.path}`, f.excerpt)),
  ];
}

export async function buildFactSheet(input: {
  role: Role;
  github: GithubProfile;
  materials: RepoMaterial[];
  linkedin: LinkedinProfile | null;
}): Promise<FactSheet> {
  const { role, github, materials, linkedin } = input;
  const covered = new Set(materials.map((m) => m.repo.fullName));
  // Split the README budget across repos so one long README can't crowd out the others.
  const readmeChars = Math.floor(18_000 / materials.length);

  const sections = [
    untrusted("github_profile", profileText(github, covered)),
    ...materials.flatMap((m) => repoSections(m, readmeChars)),
    linkedin ? untrusted("linkedin", JSON.stringify(linkedin), 6_000) : null,
  ].filter((s) => s !== null);

  const draft = await generateObject({
    name: "fact_sheet",
    schema: FactSheetDraft,
    system: factSheetSystem(role, materials.length),
    content: sections.join("\n\n"),
  });

  return {
    ...draft,
    codeSamples: materials.flatMap((m) => m.files.map((f) => ({ path: `${m.repo.fullName}/${f.path}`, excerpt: f.excerpt }))),
  };
}

export async function writePlan(input: { role: Role; repos: string[]; factSheet: FactSheet }): Promise<Plan> {
  const { role, repos, factSheet } = input;
  const plan = await generateObject({
    name: "question_plan",
    schema: Plan,
    system: planSystem(role, repos.length),
    content: [
      `Projects: ${repos.join(", ")}`,
      untrusted("fact_sheet", factsForPlanner(factSheet)),
      untrusted("code_paths", factSheet.codeSamples.map((c) => c.path).join("\n") || "none"),
    ].join("\n\n"),
  });

  // Keep only fact ids that exist, so the report can link questions to evidence.
  const known = new Set(factSheet.facts.map((f) => f.id));
  return {
    ...plan,
    questions: plan.questions.map((q) => ({ ...q, factIds: q.factIds.filter((id) => known.has(id)) })),
  };
}
