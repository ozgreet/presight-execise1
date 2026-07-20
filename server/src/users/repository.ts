import type Database from 'better-sqlite3';

import { directoryFilterKey, encodeCursor } from './query.js';
import type {
  FacetsQuery,
  FacetsResponse,
  FacetValue,
  SortField,
  UserDirectoryQuery,
  UserRecord,
  UsersResponse,
} from './types.js';

type UserRow = Omit<UserRecord, 'hobbies'>;

const sortExpressions: Record<SortField, string> = {
  first_name: 'u.first_name COLLATE NOCASE',
  last_name: 'u.last_name COLLATE NOCASE',
  age: 'u.age',
  nationality: 'u.nationality COLLATE NOCASE',
};

function placeholders(values: readonly unknown[]): string {
  return values.map(() => '?').join(', ');
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function createFilters(query: FacetsQuery): {
  parameters: unknown[];
  sql: string;
} {
  const predicates: string[] = [];
  const parameters: unknown[] = [];

  if (query.q) {
    predicates.push(
      "(u.first_name || ' ' || u.last_name) LIKE ? ESCAPE '\\' COLLATE NOCASE",
    );
    parameters.push(`%${escapeLike(query.q)}%`);
  }

  if (query.nationalities.length > 0) {
    predicates.push(
      `u.nationality COLLATE NOCASE IN (${placeholders(query.nationalities)})`,
    );
    parameters.push(...query.nationalities);
  }

  if (query.hobbies.length > 0) {
    predicates.push(`
      u.id IN (
        SELECT uh.user_id
        FROM user_hobbies AS uh
        INNER JOIN hobbies AS h ON h.id = uh.hobby_id
        WHERE h.name COLLATE NOCASE IN (${placeholders(query.hobbies)})
        GROUP BY uh.user_id
        HAVING COUNT(DISTINCT h.id) = ?
      )
    `);
    parameters.push(...query.hobbies, query.hobbies.length);
  }

  return {
    parameters,
    sql: predicates.length > 0 ? `WHERE ${predicates.join(' AND ')}` : '',
  };
}

function loadHobbies(
  database: Database.Database,
  userIds: number[],
): Map<number, string[]> {
  const hobbiesByUser = new Map<number, string[]>();

  if (userIds.length === 0) {
    return hobbiesByUser;
  }

  const rows = database
    .prepare(
      `
      SELECT uh.user_id, h.name
      FROM user_hobbies AS uh
      INNER JOIN hobbies AS h ON h.id = uh.hobby_id
      WHERE uh.user_id IN (${placeholders(userIds)})
      ORDER BY uh.user_id, h.name COLLATE NOCASE
    `,
    )
    .all(...userIds) as Array<{ name: string; user_id: number }>;

  for (const row of rows) {
    const values = hobbiesByUser.get(row.user_id) ?? [];
    values.push(row.name);
    hobbiesByUser.set(row.user_id, values);
  }

  return hobbiesByUser;
}

export function findUsers(
  database: Database.Database,
  query: UserDirectoryQuery,
): UsersResponse {
  const filters = createFilters(query);
  const sortExpression = sortExpressions[query.sort];
  const direction = query.direction.toUpperCase();
  const parameters = [...filters.parameters];
  let paginationPredicate = '';

  if (query.cursor) {
    const operator = query.direction === 'asc' ? '>' : '<';
    paginationPredicate = `${filters.sql ? ' AND' : 'WHERE'} (
      ${sortExpression} ${operator} ?
      OR (${sortExpression} = ? AND u.id ${operator} ?)
    )`;
    parameters.push(query.cursor.value, query.cursor.value, query.cursor.id);
  }

  parameters.push(query.limit + 1);

  const rows = database
    .prepare(
      `
      SELECT
        u.id,
        u.avatar,
        u.first_name,
        u.last_name,
        u.age,
        u.nationality
      FROM users AS u
      ${filters.sql}
      ${paginationPredicate}
      ORDER BY ${sortExpression} ${direction}, u.id ${direction}
      LIMIT ?
    `,
    )
    .all(...parameters) as UserRow[];

  const hasMore = rows.length > query.limit;
  const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
  const hobbiesByUser = loadHobbies(
    database,
    pageRows.map(({ id }) => id),
  );
  const users = pageRows.map((row) => ({
    ...row,
    hobbies: hobbiesByUser.get(row.id) ?? [],
  }));
  const lastUser = users.at(-1);

  return {
    users,
    pagination: {
      limit: query.limit,
      hasMore,
      nextCursor:
        hasMore && lastUser
          ? encodeCursor({
              version: 1,
              sort: query.sort,
              direction: query.direction,
              filters: directoryFilterKey(query),
              value: lastUser[query.sort],
              id: lastUser.id,
            })
          : null,
    },
  };
}

export function findFacets(
  database: Database.Database,
  query: FacetsQuery,
): FacetsResponse {
  const filters = createFilters(query);

  return database.transaction(() => {
    const hobbies = database
      .prepare(
        `
        SELECT h.name AS value, COUNT(DISTINCT u.id) AS count
        FROM users AS u
        INNER JOIN user_hobbies AS uh ON uh.user_id = u.id
        INNER JOIN hobbies AS h ON h.id = uh.hobby_id
        ${filters.sql}
        GROUP BY h.id, h.name
        ORDER BY count DESC, value COLLATE NOCASE ASC
        LIMIT 20
      `,
      )
      .all(...filters.parameters) as FacetValue[];

    const nationalities = database
      .prepare(
        `
        SELECT u.nationality AS value, COUNT(DISTINCT u.id) AS count
        FROM users AS u
        ${filters.sql}
        GROUP BY u.nationality
        ORDER BY count DESC, value COLLATE NOCASE ASC
        LIMIT 20
      `,
      )
      .all(...filters.parameters) as FacetValue[];

    return { hobbies, nationalities };
  })();
}
