import { buildFilterParams } from './users'
import { apiGet } from './client'
import type { DirectoryFilters, FacetsResponse } from '../types/api'

export async function fetchFacets(
  filters: Pick<DirectoryFilters, 'q' | 'nationalities' | 'hobbies'>,
): Promise<FacetsResponse> {
  return apiGet<FacetsResponse>('/api/facets', buildFilterParams(filters))
}
