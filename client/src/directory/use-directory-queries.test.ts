import { describe, expect, it } from 'vitest';

import type { User, UsersResponse } from '../api/users';
import { defaultDirectoryState, type DirectoryState } from './directory-state';
import {
  directoryQueryKeys,
  flattenUniqueUsers,
} from './use-directory-queries';

describe('directory query keys', () => {
  it('keys users by filters and sorting', () => {
    const filtered: DirectoryState = {
      ...defaultDirectoryState,
      q: 'Ana',
      hobbies: ['Chess'],
      nationalities: ['Brazil'],
    };
    const sorted: DirectoryState = {
      ...filtered,
      sort: 'age',
      direction: 'desc',
    };

    expect(directoryQueryKeys.users(filtered)).not.toEqual(
      directoryQueryKeys.users(defaultDirectoryState),
    );
    expect(directoryQueryKeys.users(sorted)).not.toEqual(
      directoryQueryKeys.users(filtered),
    );
  });

  it('keys facets by relevant filters but not sorting', () => {
    const filtered: DirectoryState = {
      ...defaultDirectoryState,
      q: 'Ana',
      hobbies: ['Chess'],
    };
    const sorted: DirectoryState = {
      ...filtered,
      sort: 'age',
      direction: 'desc',
    };

    expect(directoryQueryKeys.facets(filtered)).not.toEqual(
      directoryQueryKeys.facets(defaultDirectoryState),
    );
    expect(directoryQueryKeys.facets(sorted)).toEqual(
      directoryQueryKeys.facets(filtered),
    );
  });

  it('flattens pages without duplicate users', () => {
    const createUser = (id: number): User => ({
      id,
      avatar: `/avatar-${id}.svg`,
      first_name: `User${id}`,
      last_name: 'Example',
      age: 30,
      nationality: 'Canada',
      hobbies: [],
    });
    const createPage = (users: User[]): UsersResponse => ({
      users,
      pagination: {
        limit: 2,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(
      flattenUniqueUsers([
        createPage([createUser(1), createUser(2)]),
        createPage([createUser(2), createUser(3)]),
      ]).map(({ id }) => id),
    ).toEqual([1, 2, 3]);
  });
});
