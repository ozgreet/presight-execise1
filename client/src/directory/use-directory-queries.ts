import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  getFacets,
  getUsers,
  type User,
  type UsersResponse,
} from '../api/users';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import type { DirectoryState } from './directory-state';

export const directoryQueryKeys = {
  users: (state: DirectoryState) =>
    [
      'users',
      {
        q: state.q,
        hobbies: state.hobbies,
        nationalities: state.nationalities,
        sort: state.sort,
        direction: state.direction,
      },
    ] as const,
  facets: (state: DirectoryState) =>
    [
      'facets',
      {
        q: state.q,
        hobbies: state.hobbies,
        nationalities: state.nationalities,
      },
    ] as const,
};

export function flattenUniqueUsers(pages: UsersResponse[]): User[] {
  const usersById = new Map<number, User>();

  for (const page of pages) {
    for (const user of page.users) {
      if (!usersById.has(user.id)) {
        usersById.set(user.id, user);
      }
    }
  }

  return [...usersById.values()];
}

export function useDirectoryQueries(state: DirectoryState) {
  const normalizedQuery = state.q.trim();
  const debouncedQuery = useDebouncedValue(normalizedQuery, 300);
  const queryState = useMemo(
    () => ({ ...state, q: normalizedQuery }),
    [normalizedQuery, state],
  );
  const isSearchPending = normalizedQuery !== debouncedQuery;

  const usersQuery = useInfiniteQuery({
    queryKey: directoryQueryKeys.users(queryState),
    initialPageParam: null as string | null,
    enabled: !isSearchPending,
    queryFn: ({ pageParam, signal }) => getUsers(queryState, pageParam, signal),
    getNextPageParam: (lastPage) =>
      lastPage.users.length > 0
        ? (lastPage.pagination.nextCursor ?? undefined)
        : undefined,
  });

  const facetsQuery = useQuery({
    queryKey: directoryQueryKeys.facets(queryState),
    enabled: !isSearchPending,
    queryFn: ({ signal }) => getFacets(queryState, signal),
  });
  const users = useMemo(
    () => flattenUniqueUsers(usersQuery.data?.pages ?? []),
    [usersQuery.data?.pages],
  );

  return {
    usersQuery,
    users,
    facetsQuery,
    isSearchPending,
    queryState,
  };
}
