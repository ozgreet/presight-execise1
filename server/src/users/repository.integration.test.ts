import type Database from 'better-sqlite3';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { openDatabase } from '../db/database.js';
import { resetAndSeedDatabase, SEED_VALUE } from '../db/seed-database.js';
import type {
  FacetsQuery,
  FacetsResponse,
  FacetValue,
  SortDirection,
  SortField,
  UserRecord,
  UsersResponse,
} from './types.js';

type QueryInput = {
  direction?: SortDirection;
  hobbies?: string[];
  nationalities?: string[];
  q?: string;
  sort?: SortField;
};

function compareText(left: string, right: string): number {
  const normalizedLeft = left.toLocaleLowerCase();
  const normalizedRight = right.toLocaleLowerCase();

  if (normalizedLeft < normalizedRight) {
    return -1;
  }

  if (normalizedLeft > normalizedRight) {
    return 1;
  }

  return 0;
}

function matches(user: UserRecord, query: QueryInput): boolean {
  const textMatches =
    !query.q ||
    `${user.first_name} ${user.last_name}`
      .toLocaleLowerCase()
      .includes(query.q.toLocaleLowerCase());
  const selectedNationalities = new Set(
    (query.nationalities ?? []).map((value) => value.toLocaleLowerCase()),
  );
  const userHobbies = new Set(
    user.hobbies.map((value) => value.toLocaleLowerCase()),
  );
  const nationalityMatches =
    selectedNationalities.size === 0 ||
    selectedNationalities.has(user.nationality.toLocaleLowerCase());
  const hobbiesMatch = (query.hobbies ?? []).every((value) =>
    userHobbies.has(value.toLocaleLowerCase()),
  );

  return textMatches && nationalityMatches && hobbiesMatch;
}

function sortUsers(users: UserRecord[], query: QueryInput): UserRecord[] {
  const field = query.sort ?? 'last_name';
  const multiplier = query.direction === 'desc' ? -1 : 1;

  return [...users].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];
    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : compareText(String(leftValue), String(rightValue));

    return comparison === 0
      ? (left.id - right.id) * multiplier
      : comparison * multiplier;
  });
}

function expectedUsers(users: UserRecord[], query: QueryInput): UserRecord[] {
  return sortUsers(
    users.filter((user) => matches(user, query)),
    query,
  );
}

function expectedFacetValues(
  users: UserRecord[],
  query: QueryInput,
): FacetsResponse {
  const matchingUsers = users.filter((user) => matches(user, query));
  const hobbyCounts = new Map<string, number>();
  const nationalityCounts = new Map<string, number>();

  for (const user of matchingUsers) {
    nationalityCounts.set(
      user.nationality,
      (nationalityCounts.get(user.nationality) ?? 0) + 1,
    );

    for (const hobby of new Set(user.hobbies)) {
      hobbyCounts.set(hobby, (hobbyCounts.get(hobby) ?? 0) + 1);
    }
  }

  const topValues = (counts: Map<string, number>): FacetValue[] =>
    [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort(
        (left, right) =>
          right.count - left.count || compareText(left.value, right.value),
      )
      .slice(0, 20);

  return {
    hobbies: topValues(hobbyCounts),
    nationalities: topValues(nationalityCounts),
  };
}

function loadUsers(database: Database.Database): UserRecord[] {
  const users = database
    .prepare(
      'SELECT id, avatar, first_name, last_name, age, nationality FROM users ORDER BY id',
    )
    .all() as Array<Omit<UserRecord, 'hobbies'>>;
  const relationships = database
    .prepare(
      `
      SELECT uh.user_id, h.name
      FROM user_hobbies AS uh
      INNER JOIN hobbies AS h ON h.id = uh.hobby_id
      ORDER BY uh.user_id, h.name COLLATE NOCASE
    `,
    )
    .all() as Array<{ name: string; user_id: number }>;
  const hobbiesByUser = new Map<number, string[]>();

  for (const relationship of relationships) {
    const hobbies = hobbiesByUser.get(relationship.user_id) ?? [];
    hobbies.push(relationship.name);
    hobbiesByUser.set(relationship.user_id, hobbies);
  }

  return users.map((user) => ({
    ...user,
    hobbies: hobbiesByUser.get(user.id) ?? [],
  }));
}

describe('user directory SQL behavior', () => {
  let app: Express;
  let database: Database.Database;
  let users: UserRecord[];

  beforeAll(() => {
    database = openDatabase(':memory:');
    resetAndSeedDatabase(database, SEED_VALUE, 600);
    users = loadUsers(database);
    app = createApp(database);
  });

  afterAll(() => {
    database.close();
  });

  async function assertUserQuery(query: QueryInput): Promise<UsersResponse> {
    const response = await request(app)
      .get('/api/users')
      .query({ ...query, limit: 100 });
    const body = response.body as UsersResponse;
    const expected = expectedUsers(users, query).slice(0, 100);

    expect(response.status).toBe(200);
    expect(body.users.map(({ id }) => id)).toEqual(
      expected.map(({ id }) => id),
    );

    return body;
  }

  async function assertFacetQuery(query: FacetsQuery): Promise<void> {
    const response = await request(app).get('/api/users/facets').query(query);
    const body = response.body as FacetsResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual(expectedFacetValues(users, query));
  }

  it('searches first names', async () => {
    await assertUserQuery({ q: 'aar' });
  });

  it('searches last names', async () => {
    await assertUserQuery({ q: 'son' });
  });

  it('searches across the first and last name boundary', async () => {
    const target = users[0];

    expect(target).toBeDefined();

    if (!target) {
      return;
    }

    await assertUserQuery({ q: `${target.first_name} ${target.last_name}` });
  });

  it('searches names case-insensitively', async () => {
    const lowerCase = await assertUserQuery({ q: 'aar' });
    const mixedCase = await assertUserQuery({ q: 'AaR' });

    expect(mixedCase).toEqual(lowerCase);
  });

  it.each(['%', '_', '\\', "%' OR 1=1 --"])(
    'treats search input %s as literal text',
    async (q) => {
      await assertUserQuery({ q });
    },
  );

  it('filters by one nationality', async () => {
    await assertUserQuery({ nationalities: ['Canada'] });
  });

  it('uses OR semantics for multiple nationalities', async () => {
    const body = await assertUserQuery({
      nationalities: ['Canada', 'Japan', 'Spain'],
    });

    expect(
      body.users.every(({ nationality }) =>
        ['Canada', 'Japan', 'Spain'].includes(nationality),
      ),
    ).toBe(true);
  });

  it('filters by one hobby', async () => {
    await assertUserQuery({ hobbies: ['Chess'] });
  });

  it('uses AND semantics for multiple hobbies', async () => {
    const selectedHobbies = ['Chess', 'Cooking'];
    const body = await assertUserQuery({ hobbies: selectedHobbies });

    expect(
      body.users.every((user) =>
        selectedHobbies.every((hobby) => user.hobbies.includes(hobby)),
      ),
    ).toBe(true);
  });

  it('combines text, hobby, and nationality filters with AND', async () => {
    const target = users.find(({ hobbies }) => hobbies.length >= 2);

    expect(target).toBeDefined();

    if (!target) {
      return;
    }

    await assertUserQuery({
      q: target.first_name.toLocaleUpperCase(),
      hobbies: target.hobbies.slice(0, 2),
      nationalities: [target.nationality],
    });
  });

  it.each([
    ['first_name', 'asc'],
    ['first_name', 'desc'],
    ['last_name', 'asc'],
    ['last_name', 'desc'],
    ['age', 'asc'],
    ['age', 'desc'],
    ['nationality', 'asc'],
    ['nationality', 'desc'],
  ] as Array<[SortField, SortDirection]>)(
    'sorts by %s in %s order',
    async (sort, direction) => {
      await assertUserQuery({ sort, direction });
    },
  );

  it('orders duplicate sort values deterministically by id', async () => {
    const ascending = await assertUserQuery({
      sort: 'age',
      direction: 'asc',
    });
    const descending = await assertUserQuery({
      sort: 'age',
      direction: 'desc',
    });

    const assertTieOrder = (
      records: UserRecord[],
      direction: SortDirection,
    ) => {
      for (let index = 1; index < records.length; index += 1) {
        const previous = records[index - 1];
        const current = records[index];

        if (previous && current && previous.age === current.age) {
          expect(
            direction === 'asc'
              ? previous.id < current.id
              : previous.id > current.id,
          ).toBe(true);
        }
      }
    };

    assertTieOrder(ascending.users, 'asc');
    assertTieOrder(descending.users, 'desc');
  });

  it.each([
    ['first_name', 'asc'],
    ['first_name', 'desc'],
    ['last_name', 'asc'],
    ['last_name', 'desc'],
    ['age', 'asc'],
    ['age', 'desc'],
    ['nationality', 'asc'],
    ['nationality', 'desc'],
  ] as Array<[SortField, SortDirection]>)(
    'traverses %s %s pages without duplicate or missing ids',
    async (sort, direction) => {
      const query: QueryInput = { sort, direction };
      const expectedIds = expectedUsers(users, query).map(({ id }) => id);
      const receivedIds: number[] = [];
      let cursor: string | null = null;

      do {
        const response = await request(app)
          .get('/api/users')
          .query({
            ...query,
            limit: 37,
            ...(cursor ? { cursor } : {}),
          });
        const body = response.body as UsersResponse;

        expect(response.status).toBe(200);
        receivedIds.push(...body.users.map(({ id }) => id));
        cursor = body.pagination.nextCursor;
      } while (cursor);

      expect(new Set(receivedIds).size).toBe(receivedIds.length);
      expect(receivedIds).toEqual(expectedIds);
    },
  );

  it('keeps users with zero hobbies when no hobby filter is active', async () => {
    const userWithoutHobbies = users.find(
      ({ hobbies }) => hobbies.length === 0,
    );

    expect(userWithoutHobbies).toBeDefined();

    if (!userWithoutHobbies) {
      return;
    }

    const response = await request(app)
      .get('/api/users')
      .query({
        q: `${userWithoutHobbies.first_name} ${userWithoutHobbies.last_name}`,
        limit: 100,
      });
    const body = response.body as UsersResponse;

    expect(
      body.users.find(({ id }) => id === userWithoutHobbies.id)?.hobbies,
    ).toEqual([]);
  });

  it('returns correct global-context facet counts', async () => {
    await assertFacetQuery({ hobbies: [], nationalities: [] });
  });

  it('returns contextual facets under text filtering', async () => {
    await assertFacetQuery({ q: 'aar', hobbies: [], nationalities: [] });
  });

  it('returns contextual facets under hobby filtering', async () => {
    await assertFacetQuery({
      hobbies: ['Chess'],
      nationalities: [],
    });
  });

  it('returns contextual facets under nationality filtering', async () => {
    await assertFacetQuery({
      hobbies: [],
      nationalities: ['Canada', 'Japan'],
    });
  });

  it('returns contextual facets under combined filters', async () => {
    const target = users.find(({ hobbies }) => hobbies.length > 0);

    expect(target).toBeDefined();

    if (!target) {
      return;
    }

    await assertFacetQuery({
      q: target.first_name,
      hobbies: [target.hobbies[0] ?? 'Chess'],
      nationalities: [target.nationality],
    });
  });

  it('limits and deterministically orders facet values', async () => {
    const response = await request(app).get('/api/users/facets');
    const body = response.body as FacetsResponse;

    expect(body.hobbies).toHaveLength(20);
    expect(body.nationalities).toHaveLength(20);

    for (const values of [body.hobbies, body.nationalities]) {
      for (let index = 1; index < values.length; index += 1) {
        const previous = values[index - 1];
        const current = values[index];

        if (previous && current) {
          expect(
            previous.count > current.count ||
              (previous.count === current.count &&
                compareText(previous.value, current.value) < 0),
          ).toBe(true);
        }
      }
    }
  });

  it('returns empty collections for an empty result set', async () => {
    const usersResponse = await request(app)
      .get('/api/users')
      .query({ q: 'no-user-can-match-this-value' });
    const facetsResponse = await request(app)
      .get('/api/users/facets')
      .query({ q: 'no-user-can-match-this-value' });

    expect(usersResponse.body).toEqual({
      users: [],
      pagination: {
        limit: 40,
        hasMore: false,
        nextCursor: null,
      },
    });
    expect(facetsResponse.body).toEqual({
      hobbies: [],
      nationalities: [],
    });
  });
});
