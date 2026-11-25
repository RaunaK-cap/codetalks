"use client";

import { useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Star } from "lucide-react";
import type { CandidateView } from "@repo/contracts";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { Empty, Skeleton } from "@/components/app/states";
import { GithubIcon } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/labels";

const SHOWN = 8;

function StatusPill({ on }: { on: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] px-2 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
      <span className={on ? "size-1.5 rounded-full bg-live" : "size-1.5 rounded-full border border-foreground/30"} />
      {on ? "Connected" : "Not connected"}
    </span>
  );
}

export function GithubConnect({
  candidate,
  loading,
  viaGithubSignIn,
  onChange,
}: {
  candidate: CandidateView | undefined;
  loading: boolean;
  /** Signed in with GitHub: the profile is read with the user's own token. */
  viaGithubSignIn: boolean;
  onChange: (c: CandidateView) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const connect = async (input: string) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await api.connectGithub(input));
      setValue("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) void connect(value);
  };

  const gh = candidate?.github;
  const repos = gh ? [...gh.repos].sort((a, b) => Number(a.isFork) - Number(b.isFork)) : [];

  return (
    <Card className="mt-8">
      <CardHead
        title="GitHub"
        hint={
          viaGithubSignIn
            ? "Connected through your GitHub sign-in. Public repos only."
            : "Public profile and repos, read through the official GitHub API."
        }
        action={<StatusPill on={!!gh} />}
      />

      {loading ? (
        <div className="p-5">
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !gh ? (
        <form noValidate onSubmit={onSubmit} className="p-5">
          <label htmlFor="gh-login" className="font-mono text-[0.6875rem] font-medium">
            Username or profile URL
          </label>
          <div className="mt-1.5 flex max-w-lg gap-2">
            <Input
              id="gh-login"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="github.com/your-name"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby="gh-login-error"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !value.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : <GithubIcon />}
              {busy ? "Reading…" : "Connect"}
            </Button>
          </div>
          <p id="gh-login-error" className="mt-1.5 min-h-4 pl-4 font-mono text-[0.6875rem] text-destructive">
            {error}
          </p>
        </form>
      ) : (
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/[0.07] p-3">
            <Avatar className="size-10">
              <AvatarImage src={gh.avatarUrl} alt="" />
              <AvatarFallback>{gh.login.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.875rem] font-medium">{gh.name ?? gh.login}</span>
              <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                @{gh.login} · {gh.publicRepos} repos · {gh.followers} followers · synced {formatDate(gh.fetchedAt)}
              </span>
              {gh.bio && <span className="mt-1 block text-[0.75rem] text-muted-foreground">{gh.bio}</span>}
            </span>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => connect(gh.login)}>
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh
            </Button>
          </div>
          {error && <p className="mt-2 font-mono text-[0.6875rem] text-destructive">{error}</p>}

          <MonoLabel className="mt-5">Repositories ({repos.length})</MonoLabel>
          {repos.length === 0 ? (
            <Empty className="mt-2" title="No public repos" body="Interviews need at least one public repo you own." />
          ) : (
            <>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {(showAll ? repos : repos.slice(0, SHOWN)).map((r) => (
                  <li key={r.fullName} className="rounded-xl border border-foreground/[0.07] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-[0.8125rem] font-medium hover:underline"
                      >
                        {r.name}
                      </a>
                      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[0.6875rem] text-muted-foreground">
                        <Star className="size-3" /> {r.stars}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[0.75rem] text-muted-foreground">
                      {r.description ?? "No description"}
                    </p>
                    <MonoLabel className="mt-2.5">
                      {[r.language, r.isFork ? "fork" : null, `pushed ${formatDate(r.pushedAt)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </MonoLabel>
                  </li>
                ))}
              </ul>
              {repos.length > SHOWN && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-3 font-mono text-[0.6875rem] text-muted-foreground underline decoration-foreground/20 underline-offset-4 hover:text-foreground"
                >
                  {showAll ? "Show fewer" : `Show all ${repos.length}`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
