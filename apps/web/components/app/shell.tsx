"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronsUpDown, FolderGit2, History, House, LogOut, Plus, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { user } from "@/lib/mock";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/history", label: "History", icon: History },
  { href: "/sources", label: "Sources", icon: FolderGit2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/history") return pathname === "/history" || /^\/interviews\/(?!new)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserMenu({ compact = false }: { compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-xl text-left transition-colors outline-none hover:bg-black/[0.04] focus-visible:ring-4 focus-visible:ring-black/10",
          compact ? "p-1" : "w-full p-2",
        )}
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-foreground font-mono text-[0.6875rem] text-background">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium">{user.name}</span>
              <span className="block font-mono text-[0.625rem] text-muted-foreground">
                {user.plan} plan
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-52">
        <DropdownMenuLabel className="font-mono text-[0.6875rem]">Signed in as {user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/" />}>
          <House /> Landing page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/auth" />}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UsageCard() {
  const pct = (user.usedToday / user.dailyLimit) * 100;
  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-3">
      <div className="flex items-center justify-between font-mono text-[0.6875rem]">
        <span className="text-muted-foreground">Today</span>
        <span className="tabular-nums">
          {user.usedToday} / {user.dailyLimit} calls
        </span>
      </div>
      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-black/[0.06]">
        <span className="block h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[oklch(0.985_0_0)] lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-black/[0.06] bg-white px-3 py-4 lg:flex">
        <div className="px-2 py-1">
          <Logo />
        </div>
        <Link
          href="/interviews/new"
          className={buttonVariants({ className: "mt-6 w-full justify-start", shape: "soft" })}
        >
          <Plus /> New interview
        </Link>
        <nav aria-label="App" className="mt-5">
          <ul className="grid gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-black/[0.05]"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-mono text-[0.75rem] transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto grid gap-2">
          <UsageCard />
          <UserMenu />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between bg-white/85 px-4 lg:hidden">
        <Logo />
        <UserMenu compact />
      </header>

      <main className="min-w-0 px-4 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="App"
        className="glass fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-white/85 lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {[NAV[0]!, NAV[1]!, { href: "/interviews/new", label: "New", icon: Plus }, NAV[2]!, NAV[3]!].map(
            ({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              const isNew = href === "/interviews/new";
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 font-mono text-[0.625rem]",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid place-items-center rounded-full",
                        isNew ? "size-7 bg-foreground text-background" : "size-5",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    {!isNew && label}
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </nav>
    </div>
  );
}
