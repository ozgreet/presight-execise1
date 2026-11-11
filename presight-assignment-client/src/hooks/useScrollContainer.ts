import { useCallback, useState } from 'react'

export function useScrollContainer<T extends HTMLElement = HTMLDivElement>() {
  const [scrollElement, setScrollElement] = useState<T | null>(null)

  const scrollRef = useCallback((node: T | null) => {
    setScrollElement(node)
  }, [])

  return { scrollRef, scrollElement }
}
