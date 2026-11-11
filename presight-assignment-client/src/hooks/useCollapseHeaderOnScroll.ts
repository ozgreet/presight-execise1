import { useEffect } from 'react'
import { useScrollChrome } from '../context/ScrollChromeContext'

const COLLAPSE_THRESHOLD = 20

export function useCollapseHeaderOnScroll(
  scrollElement: HTMLElement | null,
  enabled = true,
) {
  const { setHeaderCollapsed } = useScrollChrome()

  useEffect(() => {
    if (!enabled || !scrollElement) {
      setHeaderCollapsed(false)
      return
    }

    const onScroll = () => {
      setHeaderCollapsed(scrollElement.scrollTop > COLLAPSE_THRESHOLD)
    }

    onScroll()
    scrollElement.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      scrollElement.removeEventListener('scroll', onScroll)
      setHeaderCollapsed(false)
    }
  }, [enabled, scrollElement, setHeaderCollapsed])
}
