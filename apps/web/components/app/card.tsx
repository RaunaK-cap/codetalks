import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Hairline white tile, the one surface used across the app. */
export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[18px] border border-foreground/[0.07] bg-card shadow-[0_1px_2px_oklch(0_0_0/4%)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHead({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h2 className="text-[0.875rem] font-medium tracking-[-0.01em]">{title}</h2>
        {hint && <p className="mt-0.5 font-mono text-[0.6875rem] text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.5rem] leading-tight font-medium tracking-[-0.03em]">{title}</h1>
        {description && (
          <p className="mt-1 font-mono text-[0.75rem] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[0.6875rem] text-muted-foreground", className)}>{children}</p>
  );
}
