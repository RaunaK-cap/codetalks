import Link from "next/link";
import { ArrowRight, FileText, FileUser, Mic } from "lucide-react";
import { Halftone } from "@/components/halftone";
import { GithubIcon, Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Bento } from "@/components/landing/bento";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Reveal, SectionLabel } from "@/components/landing/reveal";
import { Statement } from "@/components/landing/statement";

const SOURCES = [
  { icon: <GithubIcon />, label: "GitHub repos" },
  { icon: <FileText className="size-3.5" />, label: "Resume PDF" },
  { icon: <FileUser className="size-3.5" />, label: "LinkedIn export" },
  { icon: <Mic className="size-3.5" />, label: "Voice in browser" },
];

const STEPS = [
  {
    n: "01",
    title: "Connect a source",
    body: "Paste a public repo or drop your resume PDF. We build a fact sheet in about twenty seconds.",
  },
  {
    n: "02",
    title: "Take the call",
    body: "Six minutes, voice only. The interviewer asks about your files and pushes on vague answers.",
  },
  {
    n: "03",
    title: "Read the report",
    body: "A transcript, five scores, and the exact line where each answer fell short.",
  },
];

const IN_V1 = [
  "Public GitHub repos through the official API",
  "Resume PDF and LinkedIn “Save to PDF” export",
  "A six-minute voice call in English",
  "Transcript, five scores, and the gap in each answer",
];

const NOT_YET = [
  "Private repositories",
  "Live coding or a shared editor",
  "Recruiter dashboard",
  "Other languages",
];

function SectionHead({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-xl text-center">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-4 text-[1.625rem] leading-[1.12] font-medium tracking-[-0.035em] sm:text-[2.125rem]">
        {title}
      </h2>
      {body && (
        <p className="mt-3 text-[0.875rem] text-muted-foreground">{body}</p>
      )}
    </Reveal>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main>
        <Hero />

        {/* Sources strip, in place of the reference's "Trusted by" logos. */}
        <section className="border-y border-black/[0.06] px-5 py-7">
          <p className="text-center font-mono text-[0.6875rem] text-muted-foreground">
            Built from what you already have
          </p>
          <ul className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:justify-center sm:gap-10">
            {SOURCES.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-center gap-2 font-mono text-[0.75rem] text-foreground/70"
              >
                {s.icon}
                {s.label}
              </li>
            ))}
          </ul>
        </section>

        <Statement />

        <section
          id="features"
          className="mx-auto max-w-6xl px-3 pb-24 sm:px-5 sm:pb-32"
        >
          <SectionHead
            label="Features"
            title="Everything a sharp interviewer would notice."
            body="Each tile is a piece of the real flow, running live."
          />
          <div className="mt-12">
            <Bento />
          </div>
        </section>

        <section
          id="how"
          className="mx-auto max-w-6xl px-3 pb-24 sm:px-5 sm:pb-32"
        >
          <SectionHead
            label="How it works"
            title="Three steps. About ten minutes."
          />
          <ol className="mt-12 grid gap-3 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 0.08} className="h-full">
                  <div className="flex h-full flex-col rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-[0_1px_2px_oklch(0_0_0/4%)]">
                    <span className="font-mono text-[0.6875rem] text-muted-foreground">
                      {s.n}
                    </span>
                    <h3 className="mt-8 text-[0.9375rem] font-medium tracking-[-0.01em]">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="scope"
          className="mx-auto max-w-6xl px-3 pb-24 sm:px-5 sm:pb-32"
        >
          <SectionHead
            label="Scope"
            title="Honest about what ships first."
            body="CodeTalk is in active development. This is the v1 line."
          />
          <Reveal className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
            {[
              { title: "In v1", items: IN_V1, on: true },
              { title: "Not yet", items: NOT_YET, on: false },
            ].map((col) => (
              <div
                key={col.title}
                className="rounded-[18px] border border-black/[0.07] bg-white p-5"
              >
                <p className="font-mono text-[0.6875rem] text-muted-foreground">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[0.8125rem]">
                      <span
                        className={
                          col.on
                            ? "mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-live"
                            : "mt-[0.45rem] size-1.5 shrink-0 rounded-full border border-black/25"
                        }
                      />
                      <span
                        className={
                          col.on ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {it}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </section>

        {/* CTA panel echoing the auth screen: text left, halftone right. */}
        <section className="mx-auto max-w-6xl px-3 pb-3 sm:px-5 sm:pb-5">
          <Reveal>
            <div className="relative grid overflow-hidden rounded-[18px] border border-black/[0.07] bg-white md:grid-cols-2">
              <div className="relative z-10 p-7 sm:p-10">
                <h2 className="text-[1.625rem] leading-[1.12] font-medium tracking-[-0.035em] sm:text-[2.125rem]">
                  Six minutes.
                  <br />
                  Your code. Real questions.
                </h2>
                <p className="mt-3 max-w-sm font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
                  Practice the part of the interview that is actually about you.
                </p>
                <Link
                  href="/auth?mode=signup"
                  className={buttonVariants({
                    shape: "soft",
                    className: "mt-7",
                  })}
                >
                  Start free
                  <ArrowRight />
                </Link>
              </div>
              <div className="relative h-52 md:h-auto md:min-h-72">
                <Halftone
                  variant="cloud"
                  cell={7}
                  className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%)] md:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
                />
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.6875rem] text-muted-foreground"
        >
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#scope" className="hover:text-foreground">
            Scope
          </a>
          <Link href="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
        <p className="font-mono text-[0.6875rem] text-muted-foreground">
          © 2026 CodeTalk
        </p>
      </footer>
    </div>
  );
}
