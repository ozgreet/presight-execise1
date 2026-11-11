import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { fetchInsights } from '../api/insights'
import { ApiError } from '../api/client'
import type { DirectoryFilters, InsightsOverview } from '../types/api'

type InsightsFilters = Pick<DirectoryFilters, 'q' | 'nationalities' | 'hobbies'>

function insightsKey(filters: InsightsFilters): string {
  return JSON.stringify(filters)
}

export function useInsights(filters: InsightsFilters) {
  const filterKey = insightsKey(filters)
  const [overview, setOverview] = useState<InsightsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const loadedKeyRef = useRef<string | null>(null)
  const filtersRef = useRef(filters)

  filtersRef.current = filters

  const load = useCallback(async (activeFilters: InsightsFilters, activeKey: string) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const data = await fetchInsights(activeFilters)

      if (requestId !== requestIdRef.current) {
        return
      }

      loadedKeyRef.current = activeKey
      setOverview(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setOverview(null)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while loading insights.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (filterKey === loadedKeyRef.current) {
      return
    }

    startTransition(() => {
      void load(filtersRef.current, filterKey)
    })
  }, [filterKey, load])

  const retry = useCallback(() => {
    loadedKeyRef.current = null
    void load(filtersRef.current, filterKey)
  }, [filterKey, load])

  return { overview, loading, error, retry }
}
