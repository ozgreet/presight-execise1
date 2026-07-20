import { z } from 'zod';

import type { DirectoryState } from '../directory/directory-state';

const userSchema = z.object({
  id: z.number().int().positive(),
  avatar: z
    .string()
    .refine(
      (value) =>
        (value.startsWith('/') && !value.startsWith('//')) ||
        /^https?:\/\//i.test(value),
      'Avatar must use HTTP, HTTPS, or a local absolute path',
    ),
  first_name: z.string(),
  last_name: z.string(),
  age: z.number().int(),
  nationality: z.string(),
  hobbies: z.array(z.string()),
});

const paginationSchema = z.object({
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

const usersResponseSchema = z.object({
  users: z.array(userSchema),
  pagination: paginationSchema,
});

const facetValueSchema = z.object({
  value: z.string(),
  count: z.number().int().nonnegative(),
});

const facetsResponseSchema = z.object({
  hobbies: z.array(facetValueSchema).max(20),
  nationalities: z.array(facetValueSchema).max(20),
});

export type User = z.infer<typeof userSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type FacetValue = z.infer<typeof facetValueSchema>;
export type FacetsResponse = z.infer<typeof facetsResponseSchema>;

function createFilterParams(state: DirectoryState): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (state.q) {
    searchParams.set('q', state.q);
  }

  for (const hobby of state.hobbies) {
    searchParams.append('hobbies', hobby);
  }

  for (const nationality of state.nationalities) {
    searchParams.append('nationalities', nationality);
  }

  return searchParams;
}

function apiUrl(path: string, searchParams: URLSearchParams): string {
  const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const query = searchParams.toString();

  return `${baseUrl}${path}${query ? `?${query}` : ''}`;
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getUsers(
  state: DirectoryState,
  cursor: string | null,
  signal: AbortSignal,
): Promise<UsersResponse> {
  const searchParams = createFilterParams(state);
  searchParams.set('sort', state.sort);
  searchParams.set('direction', state.direction);
  searchParams.set('limit', '40');

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  return usersResponseSchema.parse(
    await getJson(apiUrl('/api/users', searchParams), signal),
  );
}

export async function getFacets(
  state: DirectoryState,
  signal: AbortSignal,
): Promise<FacetsResponse> {
  const searchParams = createFilterParams(state);

  return facetsResponseSchema.parse(
    await getJson(apiUrl('/api/users/facets', searchParams), signal),
  );
}
