import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DirectoryFilters, SortField, SortOrder } from '../types/api'

const DEFAULT_FILTERS: DirectoryFilters = {
  q: '',
  nationalities: [],
  hobbies: [],
  sort: 'first_name',
  order: 'asc',
}

const SORT_FIELDS = new Set<SortField>([
  'first_name',
  'last_name',
  'age',
  'nationality',
])

function parseList(value: string | null): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getArrayParam(searchParams: URLSearchParams, key: string): string[] {
  const values = searchParams.getAll(key)
  if (values.length === 0) {
    return []
  }

  if (values.length === 1 && values[0].includes(',')) {
    return parseList(values[0])
  }

  return values
}

function parseFilters(searchParams: URLSearchParams): DirectoryFilters {
  const sortParam = searchParams.get('sort') ?? DEFAULT_FILTERS.sort
  const orderParam = searchParams.get('order') ?? DEFAULT_FILTERS.order

  return {
    q: searchParams.get('q') ?? '',
    nationalities: getArrayParam(searchParams, 'nationalities'),
    hobbies: getArrayParam(searchParams, 'hobbies'),
    sort: SORT_FIELDS.has(sortParam as SortField)
      ? (sortParam as SortField)
      : DEFAULT_FILTERS.sort,
    order: orderParam === 'desc' ? 'desc' : 'asc',
  }
}

function toSearchParams(filters: DirectoryFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.q.trim()) {
    params.set('q', filters.q.trim())
  }

  for (const nationality of filters.nationalities) {
    params.append('nationalities', nationality)
  }

  for (const hobby of filters.hobbies) {
    params.append('hobbies', hobby)
  }

  if (filters.sort !== DEFAULT_FILTERS.sort) {
    params.set('sort', filters.sort)
  }

  if (filters.order !== DEFAULT_FILTERS.order) {
    params.set('order', filters.order)
  }

  return params
}

export function useDirectoryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => parseFilters(searchParams),
    [searchParams],
  )

  const setFilters = useCallback(
    (updater: DirectoryFilters | ((current: DirectoryFilters) => DirectoryFilters)) => {
      const next =
        typeof updater === 'function' ? updater(parseFilters(searchParams)) : updater

      setSearchParams(toSearchParams(next), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const updateFilters = useCallback(
    (patch: Partial<DirectoryFilters>) => {
      setFilters((current) => ({ ...current, ...patch }))
    },
    [setFilters],
  )

  const toggleNationality = useCallback(
    (value: string) => {
      setFilters((current) => {
        const next = new Set(current.nationalities)
        if (next.has(value)) {
          next.delete(value)
        } else {
          next.add(value)
        }
        return { ...current, nationalities: [...next] }
      })
    },
    [setFilters],
  )

  const toggleHobby = useCallback(
    (value: string) => {
      setFilters((current) => {
        const next = new Set(current.hobbies)
        if (next.has(value)) {
          next.delete(value)
        } else {
          next.add(value)
        }
        return { ...current, hobbies: [...next] }
      })
    },
    [setFilters],
  )

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [setFilters])

  const setSort = useCallback(
    (sort: SortField, order?: SortOrder) => {
      updateFilters({
        sort,
        order: order ?? filters.order,
      })
    },
    [filters.order, updateFilters],
  )

  const toggleSortOrder = useCallback(() => {
    updateFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' })
  }, [filters.order, updateFilters])

  return {
    filters,
    setFilters,
    updateFilters,
    toggleNationality,
    toggleHobby,
    clearFilters,
    setSort,
    toggleSortOrder,
  }
}
