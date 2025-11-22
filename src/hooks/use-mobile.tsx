import * as React from "react"
import { BREAKPOINTS, BREAKPOINT_QUERIES, type Breakpoint } from '@/lib/breakpoints'

/**
 * Hook to detect if viewport matches a specific breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(BREAKPOINT_QUERIES[breakpoint])
    
    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [breakpoint])

  return matches
}

/**
 * Hook to get current viewport size category
 */
export function useViewportSize() {
  const [size, setSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const updateSize = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.md) {
        setSize('mobile')
      } else if (width < BREAKPOINTS.lg) {
        setSize('tablet')
      } else {
        setSize('desktop')
      }
    }

    // Set initial size
    updateSize()

    // Listen for resize
    window.addEventListener('resize', updateSize)
    
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}

/**
 * Legacy hook for backward compatibility
 */
export function useIsMobile() {
  const viewportSize = useViewportSize()
  return viewportSize === 'mobile'
}

/**
 * Hook to get all breakpoint states
 */
export function useBreakpoints() {
  const isSm = useBreakpoint('sm')
  const isMd = useBreakpoint('md')
  const isLg = useBreakpoint('lg')
  const isXl = useBreakpoint('xl')
  const is2xl = useBreakpoint('2xl')
  const viewportSize = useViewportSize()

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile: viewportSize === 'mobile',
    isTablet: viewportSize === 'tablet',
    isDesktop: viewportSize === 'desktop',
    viewportSize,
  }
}
