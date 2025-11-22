"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary shadow-inner",
  {
    variants: {
      variant: {
        default: "bg-gray-200",
        success: "bg-green-200",
        warning: "bg-yellow-200",
        destructive: "bg-red-200",
        info: "bg-blue-200",
      },
      size: {
        default: "h-4",
        sm: "h-2.5",
        lg: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-blue-600",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        destructive: "bg-red-600",
        info: "bg-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
    VariantProps<typeof progressVariants> & {
      indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"];
    }
>(({ className, value, variant, size, indicatorVariant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressIndicatorVariants({ variant: indicatorVariant || variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Enhanced progress component with label and percentage
interface ProgressWithLabelProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: VariantProps<typeof progressVariants>["variant"];
  size?: VariantProps<typeof progressVariants>["size"];
  className?: string;
}

const ProgressWithLabel = React.forwardRef<
  HTMLDivElement,
  ProgressWithLabelProps
>(({ value, max = 100, label, showPercentage = true, variant, size, className }, ref) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          {showPercentage && <span className="text-gray-500">{percentage}%</span>}
        </div>
      )}
      <Progress value={percentage} variant={variant} size={size} />
    </div>
  );
});
ProgressWithLabel.displayName = "ProgressWithLabel";

export { Progress, ProgressWithLabel };