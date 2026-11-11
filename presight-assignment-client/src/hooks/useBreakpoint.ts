import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const QUERIES = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1199px)',
  desktop: '(min-width: 1200px)',
} as const

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  if (window.matchMedia(QUERIES.mobile).matches) {
    return 'mobile'
  }

  if (window.matchMedia(QUERIES.tablet).matches) {
    return 'tablet'
  }

  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    const mediaQueries = Object.values(QUERIES).map((query) => window.matchMedia(query))
    const onChange = () => setBreakpoint(getBreakpoint())

    onChange()
    for (const media of mediaQueries) {
      media.addEventListener('change', onChange)
    }

    return () => {
      for (const media of mediaQueries) {
        media.removeEventListener('change', onChange)
      }
    }
  }, [])

  return breakpoint
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}
