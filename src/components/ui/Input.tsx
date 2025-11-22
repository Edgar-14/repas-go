import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ComponentType<{ className?: string }>
  trailingIcon?: React.ComponentType<{ className?: string }>
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, ...props }, ref) => {
    const paddingLeft = LeadingIcon ? "pl-10" : "pl-3"
    const paddingRight = TrailingIcon ? "pr-10" : "pr-3"

    const baseClasses = cn(
      "flex h-11 w-full rounded-md border border-input bg-background text-base sm:text-sm ring-offset-background",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-all duration-200",
      "hover:border-gray-400 focus:border-blue-500",
      "py-2.5 sm:py-2",
      paddingLeft,
      paddingRight,
      className
    )

    const inputElement = (
      <input
        type={type}
        className={baseClasses}
        ref={ref}
        {...props}
      />
    )

    if (!LeadingIcon && !TrailingIcon) {
      return inputElement
    }

    return (
      <div className={cn("relative")}> 
        {LeadingIcon && (
          <LeadingIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        )}
        {inputElement}
        {TrailingIcon && (
          <TrailingIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }