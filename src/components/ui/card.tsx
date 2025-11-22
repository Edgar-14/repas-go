
import React from 'react';
import { cn } from "@/lib/utils";
import { usePortalTheme } from '@/hooks/use-portal-theme';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  const { portal } = usePortalTheme();
  
  return (
    <div
      className={cn(
        "rounded-lg shadow-md border",
        portal === 'delivery' 
          ? "bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-orange-200/20"
          : portal === 'admin'
          ? "bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-blue-200/20"
          : portal === 'repartidores'
          ? "bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-emerald-200/20"
          : "bg-white border border-gray-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("min-w-0 space-y-2 p-4 sm:p-5 md:p-6", className)}>
      {children}
    </div>
  );
}

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <h3 className={cn("text-lg sm:text-xl md:text-2xl font-medium leading-tight tracking-tight font-headline break-words", className)}>
      {children}
    </h3>
  );
}

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("p-4 sm:p-5 md:p-6 pt-0", className)}>
      {children}
    </div>
  );
}

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 pt-0", className)}>
      {children}
    </div>
  );
}
