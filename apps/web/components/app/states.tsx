import Link from "next/link";
import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Card } from "@/components/app/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Loading, empty, and error states shared by every app page. */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-lg bg-black/[0.05]", className)} />;
}

export function LoadingCards({ count = 2, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("mt-8 grid gap-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-5 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </Card>
      ))}
    </div>
  );
}

export function Empty({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.12] px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-[0.8125rem] font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm font-mono text-[0.6875rem] text-muted-foreground">{body}</p>}
      {action && (
        <Link href={action.href} className={buttonVariants({ size: "sm", className: "mt-4" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorNote({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <div role="alert" className="mt-8 rounded-xl border border-destructive/25 bg-destructive/[0.04] p-4">
      <p className="text-[0.8125rem] font-medium text-destructive">{message}</p>
      {children}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-foreground underline decoration-black/25 underline-offset-4"
        >
          <RotateCw className="size-3" /> Try again
        </button>
      )}
    </div>
  );
}

/** Shown on every page that needs a GitHub-connected candidate. */
export function ConnectFirst() {
  return (
    <Empty
      className="mt-8 py-16"
      title="Connect your GitHub to get started"
      body="Interviews are built from your public repos. It takes a few seconds."
      action={{ label: "Connect GitHub", href: "/sources" }}
    />
  );
}
