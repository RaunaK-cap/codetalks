import type { Metadata } from "next";
import { PageHeader } from "@/components/app/card";
import { NewInterview } from "@/components/app/new-interview";

export const metadata: Metadata = { title: "New interview · CodeTalk" };

export default async function NewInterviewPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  const { repo } = await searchParams;
  return (
    <>
      <PageHeader title="New interview" description="Pick a repo and a role. We write the questions, you take the call." />
      <NewInterview initialRepo={repo} />
    </>
  );
}
