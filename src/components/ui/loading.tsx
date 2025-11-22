"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", className }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
      >
        <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingPageProps {
  message?: string;
  className?: string;
}

const LoadingPage = React.forwardRef<HTMLDivElement, LoadingPageProps>(
  ({ message = "Cargando...", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-screen flex-col items-center justify-center space-y-4",
          className
        )}
      >
        <LoadingSpinner size="lg" />
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    );
  }
);
LoadingPage.displayName = "LoadingPage";

interface LoadingCardProps {
  message?: string;
  className?: string;
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ message = "Cargando...", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center space-y-4 p-8",
          className
        )}
      >
        <LoadingSpinner size="md" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    );
  }
);
LoadingCard.displayName = "LoadingCard";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, children, className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8",
    };

    return (
      <button
        ref={ref}
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "bg-blue-600 text-white hover:bg-blue-700",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
LoadingButton.displayName = "LoadingButton";

interface LoadingOverlayProps {
  loading?: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ loading = false, children, message = "Cargando...", className }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-2">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
LoadingOverlay.displayName = "LoadingOverlay";

export {
  LoadingSpinner,
  LoadingPage,
  LoadingCard,
  LoadingButton,
  LoadingOverlay,
};