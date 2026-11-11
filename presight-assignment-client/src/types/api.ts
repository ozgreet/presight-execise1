export type User = {
  id: number
  avatar: string
  first_name: string
  last_name: string
  profession: string
  age: number
  nationality: string
  hobbies: string[]
}

export type FacetItem = {
  value: string
  count: number
}

export type FacetsResponse = {
  hobbies: FacetItem[]
  nationalities: FacetItem[]
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
}

export type UsersResponse = {
  data: User[]
  pagination: PaginationMeta
}

export type SortField = 'first_name' | 'last_name' | 'age' | 'nationality'
export type SortOrder = 'asc' | 'desc'

export type DirectoryFilters = {
  q: string
  nationalities: string[]
  hobbies: string[]
  sort: SortField
  order: SortOrder
}

export type AgeBucketStat = {
  label: string
  min: number
  max: number | null
  count: number
}

export type InsightsOverview = {
  totalPeople: number
  nationalityCount: number
  hobbyCount: number
  medianAge: number | null
  filtered: boolean
  topNationalities: FacetItem[]
  topHobbies: FacetItem[]
  ageDistribution: AgeBucketStat[]
}
