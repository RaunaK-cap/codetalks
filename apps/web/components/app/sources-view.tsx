"use client";

import { GithubConnect } from "@/components/app/github-connect";
import { LinkedinUpload } from "@/components/app/linkedin-upload";
import { ErrorNote } from "@/components/app/states";
import { errorMessage } from "@/lib/api";
import { useCandidate } from "@/lib/candidate";

export function SourcesView() {
  const { candidate, isLoading, error, mutate } = useCandidate();
  return (
    <>
      {error && error.status !== 404 && <ErrorNote message={errorMessage(error)} onRetry={() => mutate()} />}
      <GithubConnect candidate={candidate} loading={isLoading} onChange={(c) => mutate(c, { revalidate: false })} />
      <LinkedinUpload candidate={candidate} onChange={(c) => mutate(c, { revalidate: false })} />
    </>
  );
}
