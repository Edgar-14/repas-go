/**
 * Responsive Container Component
 * Provides consistent responsive behavior across the app
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { useBreakpoints } from '@/hooks/use-mobile'
import { V } from 'node_modules/framer-motion/dist/types.d-DsEeKk6G'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: React.ElementType
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
}

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-4',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  as: Component = 'div',
}: ResponsiveContainerProps) {
  const { isMobile } = useBreakpoints()

  return (
    <Component
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        isMobile && 'px-3', // Override padding on mobile for better spacing
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * Responsive Grid Component
 * Automatically adjusts columns based on viewport
 */
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number  
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8',
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${cols.mobile || 1}`
    if (isTablet) return `grid-cols-${cols.tablet || 2}`
    if (isDesktop) return `grid-cols-${cols.desktop || 3}`
    return 'grid-cols-1'
  }

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Mobile-First Show/Hide Components
 */
interface ResponsiveShowProps {
  children: React.ReactNode
  on?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop'
  className?: string
}

export function ResponsiveShow({ children, on = 'desktop', className }: ResponsiveShowProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  const shouldShow = () => {
    switch (on) {
      case 'mobile': return isMobile
      case 'tablet': return isTablet
      case 'desktop': return isDesktop
      case 'mobile-tablet': return isMobile || isTablet
      case 'tablet-desktop': return isTablet || isDesktop
      default: return true
    }
  }

  if (!shouldShow()) return null

  return <div className={className}>{children}</div>
}

export function ResponsiveHide({ children, on = 'mobile', className }: ResponsiveShowProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  const shouldHide = () => {
    switch (on) {
      case 'mobile': return isMobile
      case 'tablet': return isTablet  
      case 'desktop': return isDesktop
      case 'mobile-tablet': return isMobile || isTablet
      case 'tablet-desktop': return isTablet || isDesktop
      default: return false
    }
  }

  if (shouldHide()) return null

  return <div className={className}>{children}</div>
}
