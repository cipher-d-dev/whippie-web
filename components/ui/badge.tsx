import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/index"

/**
 * Pill label. The status variants (success / warning / danger / info / neutral)
 * show a leading dot and are the only place status colour appears — always
 * paired with text, never colour alone.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-danger-soft text-danger-foreground",
        outline: "border border-border text-foreground",
        success: "bg-success-soft text-success-foreground",
        warning: "bg-warning-soft text-warning-foreground",
        danger: "bg-danger-soft text-danger-foreground",
        info: "bg-info-soft text-info-foreground",
        neutral: "bg-muted text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const dotColour: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  destructive: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show the leading status dot. On by default for status variants. */
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  const dotClass = variant ? dotColour[variant] : undefined
  const showDot = dot ?? Boolean(dotClass)
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && dotClass && (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
