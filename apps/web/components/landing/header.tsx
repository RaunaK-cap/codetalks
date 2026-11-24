"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Report", href: "#report" },
  { label: "Scope", href: "#scope" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-5">
      <div
        className={cn(
          "mx-auto mt-3 flex h-12 max-w-6xl items-center justify-between rounded-[14px] px-3 transition-[background-color,box-shadow,backdrop-filter] duration-300 sm:px-4",
          scrolled ? "glass bg-white/80" : "bg-transparent",
        )}
      >
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-[0.75rem] transition-colors",
                    scrolled
                      ? "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground"
                      : "text-white/90 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/auth"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              shape: "soft",
              className: scrolled
                ? ""
                : "text-white hover:bg-white/15 hover:text-white",
            })}
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className={buttonVariants({ size: "sm", shape: "soft" })}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
