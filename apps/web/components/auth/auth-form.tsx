"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import { GithubIcon, GoogleIcon, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export type AuthMode = "signin" | "signup";

const ease = [0.16, 1, 0.3, 1] as const;

const COPY = {
  signin: {
    title: "Sign in",
    sub: "Continue to your interviews",
    submit: "Sign in",
    switchText: "Don’t have an account?",
    switchCta: "Create an account",
  },
  signup: {
    title: "Create account",
    sub: "Your first interview takes five minutes",
    submit: "Create account",
    switchText: "Already have an account?",
    switchCta: "Sign in instead",
  },
} as const;

type Field = "name" | "username" | "email" | "identifier" | "password";
type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_.]{3,30}$/;

function validate(mode: AuthMode, data: FormData): Errors {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  const password = String(data.get("password") ?? "");

  if (mode === "signup") {
    if (!get("name")) errors.name = "Tell us what to call you.";
    if (!USERNAME.test(get("username"))) errors.username = "3–30 letters, numbers, _ or .";
    if (!EMAIL.test(get("email"))) errors.email = "Enter a valid email address.";
    if (password.length < 8) errors.password = "Use at least 8 characters.";
  } else {
    if (!get("identifier")) errors.identifier = "Enter your email or username.";
    if (!password) errors.password = "Enter your password.";
  }
  return errors;
}

/* Only same-site paths, so ?next= can't send people to another website. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease }}
          className="overflow-hidden pl-4 font-mono text-[0.6875rem] text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Collapsible({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease }}
          className="-m-1 overflow-hidden p-1"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AuthForm({ initial, next }: { initial: AuthMode; next?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { data: providers } = useSWR("providers", api.providers);
  const [mode, setMode] = useState<AuthMode>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"form" | "github" | "google" | null>(null);
  const copy = COPY[mode];
  const destination = safeNext(next);

  // Already signed in (a real session, not just a cookie): skip the form.
  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session) router.replace(destination);
  }, [session, router, destination]);

  const switchMode = () => {
    const nextMode = mode === "signin" ? "signup" : "signin";
    setMode(nextMode);
    setErrors({});
    setFormError(null);
    window.history.replaceState(null, "", nextMode === "signup" ? "/auth?mode=signup" : "/auth");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(mode, data);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    const get = (k: string) => String(data.get(k) ?? "").trim();
    const password = String(data.get("password") ?? "");
    setPending("form");

    const { error } =
      mode === "signup"
        ? await authClient.signUp.email({ name: get("name"), username: get("username"), email: get("email"), password })
        : get("identifier").includes("@")
          ? await authClient.signIn.email({ email: get("identifier"), password })
          : await authClient.signIn.username({ username: get("identifier"), password });

    if (error) {
      setPending(null);
      setFormError(error.message ?? "Something went wrong. Try again.");
      return;
    }
    router.replace(destination);
  };

  const social = async (provider: "github" | "google") => {
    setFormError(null);
    setPending(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: destination,
      errorCallbackURL: "/auth",
    });
    // On success the browser is already on its way to GitHub/Google.
    if (error) {
      setPending(null);
      setFormError(error.message ?? `Couldn't start ${provider} sign-in.`);
    }
  };

  const swap = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.35, ease },
      };

  const busy = pending !== null;

  return (
    <div className="mx-auto w-full max-w-[19rem]">
      <LogoMark className="size-6" />

      <div className="mt-6 h-[3.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} {...swap}>
            <h1 className="text-[1.375rem] font-medium tracking-[-0.03em] text-foreground">{copy.title}</h1>
            <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 grid gap-2">
        {(
          [
            ["github", "Continue with GitHub", <GithubIcon key="g" />],
            ["google", "Continue with Google", <GoogleIcon key="o" />],
          ] as const
        ).map(([provider, label, icon]) => {
          const enabled = providers?.[provider] ?? false;
          return (
            <Button
              key={provider}
              variant="outline"
              className="w-full"
              type="button"
              disabled={busy || !enabled}
              title={enabled ? undefined : "Not set up yet"}
              onClick={() => social(provider)}
            >
              {pending === provider ? <Loader2 className="animate-spin" /> : icon}
              {label}
            </Button>
          );
        })}
      </div>

      <div className="my-5 flex items-center gap-3 font-mono text-[0.625rem] text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-foreground/[0.08]" />
        or
        <span className="h-px flex-1 bg-foreground/[0.08]" />
      </div>

      <form noValidate onSubmit={onSubmit}>
        <motion.div layout={!reduce} transition={{ duration: 0.4, ease }} className="grid gap-3.5">
          <Collapsible show={mode === "signup"}>
            <div className="grid gap-3.5">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" placeholder="Enter your name" aria-invalid={!!errors.name} aria-describedby="name-error" />
                <FieldError id="name-error" message={errors.name} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Pick a username"
                  aria-invalid={!!errors.username}
                  aria-describedby="username-error"
                />
                <FieldError id="username-error" message={errors.username} />
              </div>
            </div>
          </Collapsible>

          <motion.div layout={!reduce ? "position" : false} className="grid gap-1.5">
            {mode === "signup" ? (
              <>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                />
                <FieldError id="email-error" message={errors.email} />
              </>
            ) : (
              <>
                <Label htmlFor="identifier">Email or username</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="you@example.com or username"
                  aria-invalid={!!errors.identifier}
                  aria-describedby="identifier-error"
                />
                <FieldError id="identifier-error" message={errors.identifier} />
              </>
            )}
          </motion.div>

          <motion.div layout={!reduce ? "position" : false} className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signin" ? "Enter your password" : "At least 8 characters"}
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
            />
            <FieldError id="password-error" message={errors.password} />
          </motion.div>

          <motion.div layout={!reduce ? "position" : false}>
            <p role="alert" aria-live="polite" className="min-h-0 font-mono text-[0.6875rem] text-destructive empty:hidden">
              {formError}
            </p>
            <Button type="submit" className="mt-1.5 w-full" disabled={busy}>
              {pending === "form" ? <Loader2 className="animate-spin" /> : copy.submit}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <motion.div layout={!reduce ? "position" : false} className="mt-6 text-center font-mono text-[0.6875rem]">
        <p className="text-muted-foreground">{copy.switchText}</p>
        <button
          type="button"
          onClick={switchMode}
          disabled={busy}
          className="mt-1 font-medium text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
        >
          {copy.switchCta}
        </button>
      </motion.div>
    </div>
  );
}
