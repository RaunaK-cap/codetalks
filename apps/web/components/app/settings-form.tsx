"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { ErrorNote, LoadingCards } from "@/components/app/states";
import { GithubIcon } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useMe } from "@/lib/me";

export function SettingsForm() {
  const router = useRouter();
  const { user, candidate, isLoading, error, mutate } = useMe();
  const [signingOut, setSigningOut] = useState(false);

  if (error) return <ErrorNote message={errorMessage(error)} onRetry={() => mutate()} />;
  if (isLoading || !user) return <LoadingCards count={1} />;

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    await mutate(undefined, { revalidate: false });
    router.replace("/auth");
  };

  const gh = candidate?.github;
  return (
    <>
      <Card className="mt-8">
        <CardHead title="Account" />
        <div className="flex flex-wrap items-center gap-3 p-5">
          <Avatar className="size-10">
            {(user.image ?? gh?.avatarUrl) && <AvatarImage src={user.image ?? gh!.avatarUrl} alt="" />}
            <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.875rem] font-medium">{user.name}</span>
            <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
              {user.username ? `@${user.username} · ` : ""}
              {user.email}
            </span>
          </span>
        </div>
      </Card>

      <Card className="mt-3">
        <CardHead title="GitHub" hint="Interviews are built from this profile." />
        <div className="flex flex-wrap items-center gap-3 p-5">
          {gh ? (
            <>
              <MonoLabel className="flex-1">
                @{gh.login} · {gh.repos.length} repos
              </MonoLabel>
              <a href={gh.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <GithubIcon /> Profile
              </a>
            </>
          ) : (
            <MonoLabel className="flex-1">Not connected yet.</MonoLabel>
          )}
          <Link href="/sources" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Sources
          </Link>
        </div>
      </Card>

      <Card className="mt-3">
        <CardHead title="Sign out" hint="Ends your session on this browser." />
        <div className="p-5">
          <Button variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
            {signingOut && <Loader2 className="animate-spin" />} Sign out
          </Button>
        </div>
      </Card>
    </>
  );
}
