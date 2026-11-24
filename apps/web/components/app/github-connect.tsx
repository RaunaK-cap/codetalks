"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { GithubIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/* Accepts "octocat", "@octocat", or "github.com/octocat" (with or without https). */
function parseLogin(raw: string): string | null {
  const v = raw.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "").split(/[/?#]/)[0] ?? "";
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(v) ? v : null;
}

type State =
  | { status: "idle" }
  | { status: "connecting"; login: string }
  | { status: "waiting"; login: string };

/*
 * Connect step only. The backend will read the profile and repos through the GitHub API
 * and this card will list them. Until then it shows a waiting state.
 */
export function GithubConnect() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });

  const connect = (login: string) => {
    setState({ status: "connecting", login });
    setTimeout(() => setState({ status: "waiting", login }), 900);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const login = parseLogin(value);
    if (!login) {
      setError("Enter a GitHub username or profile URL.");
      return;
    }
    setError(null);
    connect(login);
  };

  const status =
    state.status === "idle" ? "Not connected" : state.status === "connecting" ? "Connecting" : "Connected";

  return (
    <Card className="mt-8">
      <CardHead
        title="GitHub"
        hint="Public repos only, read through the official GitHub API. We never scrape."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] px-2 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                state.status === "idle" ? "border border-black/30" : "bg-live",
              )}
            />
            {status}
          </span>
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-5 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center"
          >
            <div>
              <Button type="button" className="w-full sm:w-auto" onClick={() => connect("you")}>
                <GithubIcon /> Connect with GitHub
              </Button>
              <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">
                Recommended. Higher rate limits, no typing.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-[0.625rem] text-muted-foreground uppercase md:flex-col">
              <span className="h-px flex-1 bg-black/[0.08] md:h-6 md:w-px md:flex-none" />
              or
              <span className="h-px flex-1 bg-black/[0.08] md:h-6 md:w-px md:flex-none" />
            </div>

            <form noValidate onSubmit={onSubmit}>
              <label htmlFor="gh-login" className="font-mono text-[0.6875rem] font-medium">
                Username or profile URL
              </label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="gh-login"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="github.com/your-name"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!error}
                  aria-describedby="gh-login-error"
                />
                <Button type="submit" variant="outline">
                  Add
                </Button>
              </div>
              <p id="gh-login-error" className="mt-1.5 min-h-4 pl-4 font-mono text-[0.6875rem] text-destructive">
                {error}
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="p-5"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.07] p-3">
              <span className="grid size-9 place-items-center rounded-full bg-foreground text-background">
                <GithubIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-medium">@{state.login}</span>
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground">
                  {state.status === "connecting" ? (
                    <>
                      <Loader2 className="size-3 animate-spin" /> Connecting…
                    </>
                  ) : (
                    "Waiting for the first sync"
                  )}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setState({ status: "idle" });
                  setValue("");
                }}
              >
                Disconnect
              </Button>
            </div>

            <MonoLabel className="mt-5">Repositories</MonoLabel>
            <div className="mt-2 grid gap-2 sm:grid-cols-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-dashed border-black/[0.1] p-3.5">
                  <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-black/[0.06]" />
                  <span className="mt-2.5 block h-2 w-4/5 animate-pulse rounded-full bg-black/[0.04]" />
                  <span className="mt-3 block h-2 w-1/4 animate-pulse rounded-full bg-black/[0.04]" />
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground">
              Your profile and repos will show here once we read them from GitHub.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
