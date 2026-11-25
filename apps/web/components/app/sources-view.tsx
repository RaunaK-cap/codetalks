"use client";

import type { CandidateView } from "@repo/contracts";
import { GithubConnect } from "@/components/app/github-connect";
import { LinkedinUpload } from "@/components/app/linkedin-upload";
import { ErrorNote } from "@/components/app/states";
import { errorMessage } from "@/lib/api";
import { useMe } from "@/lib/me";

export function SourcesView() {
  const { me, candidate, isLoading, error, mutate } = useMe();
  const update = (c: CandidateView) => mutate((m) => (m ? { ...m, candidate: c } : m), { revalidate: false });
  return (
    <>
      {error && <ErrorNote message={errorMessage(error)} onRetry={() => mutate()} />}
      <GithubConnect candidate={candidate} loading={isLoading} viaGithubSignIn={!!me?.hasGithubAccount} onChange={update} />
      <LinkedinUpload candidate={candidate} onChange={update} />
    </>
  );
}
