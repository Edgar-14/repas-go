'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoints } from '@/hooks/use-mobile';

interface PageWrapperResponsiveProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Responsive page wrapper that handles padding and max-width
 * automatically based on viewport size
 */
export function PageWrapperResponsive({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
}: PageWrapperResponsiveProps) {
  const { isMobile, isTablet } = useBreakpoints();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4 md:px-6',
    md: 'px-3 sm:px-4 md:px-6 lg:px-8',
    lg: 'px-4 sm:px-6 md:px-8 lg:px-12',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface FlexToolbarResponsiveProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Responsive toolbar that stacks on mobile and spreads on desktop
 */
export function FlexToolbarResponsive({
  children,
  className,
  direction = 'row',
  gap = 'md',
}: FlexToolbarResponsiveProps) {
  const gapMap = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 md:gap-5',
    lg: 'gap-4 sm:gap-6 md:gap-8',
  };

  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between w-full',
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface GridResponsiveProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Responsive grid that automatically adjusts columns
 */
export function GridResponsive({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: GridResponsiveProps) {
  const gapMap = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 md:gap-6',
    lg: 'gap-4 sm:gap-6 md:gap-8',
  };

  return (
    <div
      className={cn(
        `grid grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`,
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardStackResponsiveProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
  scrollHorizontal?: boolean;
}

/**
 * Responsive card stack - stacks vertically on mobile, can scroll horizontally on mobile if needed
 */
export function CardStackResponsive({
  children,
  className,
  spacing = 'md',
  scrollHorizontal = false,
}: CardStackResponsiveProps) {
  const spacingMap = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-3 sm:space-y-4 md:space-y-6',
    lg: 'space-y-4 sm:space-y-6 md:space-y-8',
  };

  return (
    <div
      className={cn(
        spacingMap[spacing],
        scrollHorizontal && 'overflow-x-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ButtonGroupResponsiveProps {
  children: React.ReactNode;
  className?: string;
  stackOnMobile?: boolean;
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Responsive button group that wraps on mobile
 */
export function ButtonGroupResponsive({
  children,
  className,
  stackOnMobile = true,
  gap = 'md',
}: ButtonGroupResponsiveProps) {
  const gapMap = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-2 sm:gap-3 md:gap-4',
    lg: 'gap-3 sm:gap-4 md:gap-6',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center',
        gapMap[gap],
        stackOnMobile && 'flex-col sm:flex-row w-full sm:w-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
