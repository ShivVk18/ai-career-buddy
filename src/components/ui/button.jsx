import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,box-shadow,transform,border-color] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        glow: "bg-primary text-primary-foreground shadow-[0_0_0_1px_var(--primary),0_8px_28px_-6px_var(--glow)] hover:bg-primary-hover hover:shadow-[0_0_0_1px_var(--primary),0_10px_34px_-4px_var(--glow)]",
        lime: "bg-lime text-lime-foreground shadow-sm hover:brightness-95",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        outline: "border border-line bg-panel text-foreground hover:bg-soft hover:border-primary/40",
        secondary: "bg-soft text-foreground hover:bg-line",
        ghost: "text-foreground hover:bg-soft",
        link: "text-primary-ink underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
