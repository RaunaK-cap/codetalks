"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * Pill input from the auth reference: hairline border, mono 12px text,
 * a soft ring on focus and a red edge when aria-invalid is set.
 */
const inputClass =
  "h-9 w-full min-w-0 rounded-full border border-foreground/10 bg-card px-4 font-mono text-[0.75rem] text-foreground shadow-[0_1px_2px_oklch(0_0_0/4%)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-foreground/35 hover:border-foreground/20 focus-visible:border-foreground/30 focus-visible:ring-4 focus-visible:ring-foreground/[0.06] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/60 aria-invalid:ring-4 aria-invalid:ring-destructive/10"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClass, className)}
      {...props}
    />
  )
}

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  )
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("font-mono text-[0.6875rem] font-medium text-foreground", className)}
      {...props}
    />
  )
}

export { Input, PasswordInput, Label }
