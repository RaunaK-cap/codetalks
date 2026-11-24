import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/*
 * Small, quiet controls. Mono labels at 12px.
 * "pill" for auth and forms, "soft" (6px corners) for page CTAs, like the references.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-mono text-[0.75rem] font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out outline-none select-none focus-visible:ring-4 focus-visible:ring-foreground/10 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/18%),0_1px_2px_oklch(0_0_0/20%)] hover:bg-primary/85",
        outline:
          "border-black/10 bg-white text-foreground shadow-[0_1px_2px_oklch(0_0_0/5%)] hover:border-black/20 hover:bg-neutral-50",
        glass:
          "glass text-foreground hover:bg-white/80",
        ghost: "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
        link: "h-auto px-0 text-foreground underline decoration-black/25 underline-offset-4 hover:decoration-foreground",
      },
      size: {
        sm: "h-8 px-3.5",
        default: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "size-8",
      },
      shape: {
        pill: "rounded-full",
        soft: "rounded-[7px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  }
)

function Button({
  className,
  variant,
  size,
  shape,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
