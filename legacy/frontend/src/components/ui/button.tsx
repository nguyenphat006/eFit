import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-display font-extrabold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-button-blue hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-button-orange",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm font-sans font-bold",
        secondary:
          "btn-gradient-orange hover:shadow-lg hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground font-sans font-bold",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 rounded-xl text-[13px]",
        xs: "h-8 px-3 rounded-lg text-xs",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-sm",
        icon: "h-11 w-11 rounded-xl",
        "icon-xs": "h-8 w-8 rounded-lg",
        "icon-sm": "h-10 w-10 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
