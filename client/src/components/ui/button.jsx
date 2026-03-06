import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary/90 focus:ring-primary",

        accent:
          "bg-accent text-white hover:bg-accentHover focus:ring-accent",

        secondary:
          "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",

        danger:
          "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",

        ghost:
          "bg-transparent hover:bg-gray-100 text-gray-700",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

const Button = React.forwardRef(
  (
    { className, variant, size, fullWidth, loading, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
