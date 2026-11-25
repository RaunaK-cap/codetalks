"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import { GithubIcon, GoogleIcon, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";

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

type Errors = Partial<Record<"name" | "email" | "password", string>>;

function validate(mode: AuthMode, data: FormData): Errors {
  const errors: Errors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (mode === "signup" && !name) errors.name = "Tell us what to call you.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (mode === "signup" && password.length < 8) errors.password = "Use at least 8 characters.";
  if (mode === "signin" && !password) errors.password = "Enter your password.";
  return errors;
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

export function AuthForm({ initial }: { initial: AuthMode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  const switchMode = () => {
    const next = mode === "signin" ? "signup" : "signin";
    setMode(next);
    setErrors({});
    window.history.replaceState(null, "", next === "signup" ? "/auth?mode=signup" : "/auth");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(mode, new FormData(e.currentTarget));
    setErrors(found);
    if (Object.keys(found).length) return;
    // Auth is not wired to the API yet. Simulate the round trip, then enter the app.
    setPending(true);
    setTimeout(() => router.push("/dashboard"), 900);
  };

  const swap = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
        transition: { duration: 0.35, ease },
      };

  return (
    <div className="mx-auto w-full max-w-[19rem]">
      <LogoMark className="size-6" />

      <div className="mt-6 h-[3.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} {...swap}>
            <h1 className="text-[1.375rem] font-medium tracking-[-0.03em] text-foreground">
              {copy.title}
            </h1>
            <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 grid gap-2">
        <Button variant="outline" className="w-full" type="button">
          <GithubIcon />
          Continue with GitHub
        </Button>
        <Button variant="outline" className="w-full" type="button">
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 font-mono text-[0.625rem] text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-black/[0.08]" />
        or
        <span className="h-px flex-1 bg-black/[0.08]" />
      </div>

      <form noValidate onSubmit={onSubmit}>
        <motion.div layout={!reduce} transition={{ duration: 0.4, ease }} className="grid gap-3.5">
          <AnimatePresence initial={false}>
            {mode === "signup" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease }}
                className="-m-1 overflow-hidden p-1"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Enter your name"
                    aria-invalid={!!errors.name}
                    aria-describedby="name-error"
                  />
                  <FieldError id="name-error" message={errors.name} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout={!reduce ? "position" : false} className="grid gap-1.5">
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
          </motion.div>

          <motion.div layout={!reduce ? "position" : false} className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <AnimatePresence initial={false}>
                {mode === "signin" && (
                  <motion.a
                    href="#"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-[0.6875rem] font-medium text-foreground underline decoration-black/25 underline-offset-4 hover:decoration-foreground"
                  >
                    Forgot password?
                  </motion.a>
                )}
              </AnimatePresence>
            </div>
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
            <Button type="submit" className="mt-1.5 w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : copy.submit}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <motion.div
        layout={!reduce ? "position" : false}
        className="mt-6 text-center font-mono text-[0.6875rem]"
      >
        <p className="text-muted-foreground">{copy.switchText}</p>
        <button
          type="button"
          onClick={switchMode}
          className="mt-1 font-medium text-foreground underline decoration-black/25 underline-offset-4 hover:decoration-foreground"
        >
          {copy.switchCta}
        </button>
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden pt-4 text-[0.625rem] leading-relaxed text-muted-foreground"
            >
              By continuing you agree to the Terms and Privacy Policy.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
