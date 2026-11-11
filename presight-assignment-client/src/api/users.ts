import { apiGet } from './client'
import type { DirectoryFilters, UsersResponse } from '../types/api'

export function buildFilterParams(
  filters: Pick<DirectoryFilters, 'q' | 'nationalities' | 'hobbies'>,
): URLSearchParams {
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

  return params
}

export async function fetchUsers(
  filters: DirectoryFilters,
  page: number,
  limit = 20,
): Promise<UsersResponse> {
  const params = buildFilterParams(filters)
  params.set('sort', filters.sort)
  params.set('order', filters.order)
  params.set('page', String(page))
  params.set('limit', String(limit))

  return apiGet<UsersResponse>('/api/users', params)
}
