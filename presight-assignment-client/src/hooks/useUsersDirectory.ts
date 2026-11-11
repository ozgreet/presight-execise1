import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFacets } from '../api/facets'
import { fetchUsers } from '../api/users'
import type {
  DirectoryFilters,
  FacetsResponse,
  PaginationMeta,
  User,
} from '../types/api'
import { ApiError } from '../api/client'

type DirectoryState = {
  users: User[]
  facets: FacetsResponse
  pagination: PaginationMeta | null
  loading: boolean
  loadingMore: boolean
  error: string | null
}

const EMPTY_FACETS: FacetsResponse = { hobbies: [], nationalities: [] }

function filtersKey(filters: DirectoryFilters): string {
  return JSON.stringify(filters)
}

export function useUsersDirectory(filters: DirectoryFilters) {
  const [state, setState] = useState<DirectoryState>({
    users: [],
    facets: EMPTY_FACETS,
    pagination: null,
    loading: true,
    loadingMore: false,
    error: null,
  })

  const requestIdRef = useRef(0)
  const loadMoreInFlightRef = useRef(false)
  const loadedKeyRef = useRef<string | null>(null)
  const filtersRef = useRef(filters)
  const stateRef = useRef(state)

  filtersRef.current = filters
  stateRef.current = state

  const loadInitial = useCallback(async (activeFilters: DirectoryFilters) => {
    const requestId = ++requestIdRef.current
    loadMoreInFlightRef.current = false

    setState((current) => ({
      ...current,
      loading: true,
      loadingMore: false,
      error: null,
    }))

    try {
      const [usersResponse, facetsResponse] = await Promise.all([
        fetchUsers(activeFilters, 1),
        fetchFacets(activeFilters),
      ])

      if (requestId !== requestIdRef.current) {
        return
      }

      setState({
        users: usersResponse.data,
        facets: facetsResponse,
        pagination: usersResponse.pagination,
        loading: false,
        loadingMore: false,
        error: null,
      })
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setState({
        users: [],
        facets: EMPTY_FACETS,
        pagination: null,
        loading: false,
        loadingMore: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Something went wrong while loading the directory.',
      })
    }
  }, [])

  const loadMore = useCallback(async () => {
    const current = stateRef.current

    if (
      loadMoreInFlightRef.current ||
      current.loading ||
      current.loadingMore ||
      !current.pagination?.hasMore
    ) {
      return
    }

    loadMoreInFlightRef.current = true
    const requestId = ++requestIdRef.current
    const nextPage = current.pagination.page + 1

    setState((previous) => ({ ...previous, loadingMore: true, error: null }))

    try {
      const usersResponse = await fetchUsers(filtersRef.current, nextPage)

      if (requestId !== requestIdRef.current) {
        return
      }

      setState((previous) => ({
        ...previous,
        users: [...previous.users, ...usersResponse.data],
        pagination: usersResponse.pagination,
        loadingMore: false,
      }))
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setState((previous) => ({
        ...previous,
        loadingMore: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Something went wrong while loading more people.',
      }))
    } finally {
      loadMoreInFlightRef.current = false
    }
  }, [])

  const filterKey = filtersKey(filters)

  useEffect(() => {
    if (filterKey === loadedKeyRef.current) {
      return
    }

    loadedKeyRef.current = filterKey
    void loadInitial(filtersRef.current)
  }, [filterKey, loadInitial])

  const retry = useCallback(() => {
    loadedKeyRef.current = null
    void loadInitial(filters)
  }, [filters, loadInitial])

  return {
    ...state,
    loadMore,
    retry,
  }
}
