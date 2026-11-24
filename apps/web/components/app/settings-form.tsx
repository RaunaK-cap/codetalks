"use client";

import Link from "next/link";
import { Card, CardHead } from "@/components/app/card";
import { ConnectFirst, LoadingCards } from "@/components/app/states";
import { GithubIcon } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCandidate } from "@/lib/candidate";

export function SettingsForm() {
  const { candidate, isLoading, forget } = useCandidate();

  if (isLoading) return <LoadingCards count={1} />;
  if (!candidate) return <ConnectFirst />;

  const gh = candidate.github;
  return (
    <>
      <Card className="mt-8">
        <CardHead title="Account" hint="Sign-in comes later. For now this browser remembers your GitHub profile." />
        <div className="flex flex-wrap items-center gap-3 p-5">
          <Avatar className="size-10">
            <AvatarImage src={gh.avatarUrl} alt="" />
            <AvatarFallback>{gh.login.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.875rem] font-medium">{gh.name ?? gh.login}</span>
            <span className="block font-mono text-[0.6875rem] text-muted-foreground">@{gh.login}</span>
          </span>
          <a href={gh.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <GithubIcon /> Profile
          </a>
          <Link href="/sources" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Sources
          </Link>
        </div>
      </Card>

      <Card className="mt-3">
        <CardHead
          title="Disconnect this browser"
          hint="Forgets your profile here. Your interviews stay saved and come back if you connect the same GitHub again."
        />
        <div className="p-5">
          <Button variant="outline" size="sm" onClick={forget}>
            Disconnect
          </Button>
        </div>
      </Card>
    </>
  );
}
