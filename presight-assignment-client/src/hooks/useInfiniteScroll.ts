import { useEffect, useRef } from 'react'

type UseInfiniteScrollOptions = {
  scrollElement: HTMLElement | null
  sentinelRef: React.RefObject<HTMLElement | null>
  enabled: boolean
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  onLoadMore: () => void
  itemCount: number
  rootMargin?: string
  maxAutoPrefill?: number
}

export function useInfiniteScroll({
  scrollElement,
  sentinelRef,
  enabled,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  itemCount,
  rootMargin = '240px',
  maxAutoPrefill = 2,
}: UseInfiniteScrollOptions) {
  const onLoadMoreRef = useRef(onLoadMore)
  const statusRef = useRef({ hasMore, loading, loadingMore })
  const autoPrefillCountRef = useRef(0)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    statusRef.current = { hasMore, loading, loadingMore }
  }, [hasMore, loading, loadingMore])

  useEffect(() => {
    if (itemCount === 0) {
      autoPrefillCountRef.current = 0
    }
  }, [itemCount])

  useEffect(() => {
    if (!enabled || !scrollElement) {
      return
    }

    const sentinel = sentinelRef.current
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) {
          return
        }

        const status = statusRef.current
        if (status.loading || status.loadingMore || !status.hasMore) {
          return
        }

        const isScrollable = scrollElement.scrollHeight > scrollElement.clientHeight + 1
        if (!isScrollable) {
          if (autoPrefillCountRef.current >= maxAutoPrefill) {
            return
          }
          autoPrefillCountRef.current += 1
        }

        onLoadMoreRef.current()
      },
      { root: scrollElement, rootMargin, threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    enabled,
    itemCount,
    maxAutoPrefill,
    rootMargin,
    scrollElement,
    sentinelRef,
  ])
}
