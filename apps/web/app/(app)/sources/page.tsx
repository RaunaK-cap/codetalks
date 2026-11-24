import type { Metadata } from "next";
import { PageHeader } from "@/components/app/card";
import { SourcesView } from "@/components/app/sources-view";

export const metadata: Metadata = { title: "Sources · CodeTalk" };

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Sources"
        description="What your interviews are built from. GitHub is required, LinkedIn is optional."
      />
      <SourcesView />
    </>
  );
}
