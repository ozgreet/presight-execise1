import type { SortField, User } from '../../types/api'

export function getUserDisplayName(user: User): string {
  return `${user.first_name} ${user.last_name}`
}

export function getUserInitials(user: User): string {
  return `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
}

export const SORT_OPTIONS = [
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'age', label: 'Age' },
  { value: 'nationality', label: 'Nationality' },
] as const satisfies ReadonlyArray<{ value: SortField; label: string }>
