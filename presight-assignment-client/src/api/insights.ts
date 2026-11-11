import { buildFilterParams } from './users'
import { apiGet } from './client'
import type { DirectoryFilters, InsightsOverview } from '../types/api'

export async function fetchInsights(
  filters: Pick<DirectoryFilters, 'q' | 'nationalities' | 'hobbies'>,
): Promise<InsightsOverview> {
  return apiGet<InsightsOverview>('/api/insights', buildFilterParams(filters))
}
