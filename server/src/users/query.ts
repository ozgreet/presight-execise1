import { createHash } from 'node:crypto';

import { z } from 'zod';

import { ApiError } from '../middleware/api-error.js';
import {
  sortDirections,
  sortFields,
  type FacetsQuery,
  type PaginationCursor,
  type UserDirectoryQuery,
} from './types.js';

const filterListSchema = z
  .preprocess(
    (value) => {
      if (value === undefined) {
        return [];
      }

      const values = Array.isArray(value) ? value : [value];

      if (!values.every((item) => typeof item === 'string')) {
        return value;
      }

      return values
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean);
    },
    z.array(z.string().max(100)).max(20),
  )
  .transform((values) => {
    const uniqueValues = new Map<string, string>();

    for (const value of values) {
      uniqueValues.set(value.toLocaleLowerCase(), value);
    }

    return [...uniqueValues.values()];
  });

const textQuerySchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() || undefined;
}, z.string().max(100).optional());

const baseQuerySchema = z.object({
  hobbies: filterListSchema.default([]),
  nationalities: filterListSchema.default([]),
  q: textQuerySchema,
});

const usersQuerySchema = baseQuerySchema.extend({
  cursor: z.string().min(1).max(1_000).optional(),
  direction: z.enum(sortDirections).default('asc'),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  sort: z.enum(sortFields).default('last_name'),
});

const cursorSchema = z.object({
  direction: z.enum(sortDirections),
  filters: z.string().length(43),
  id: z.number().int().positive(),
  sort: z.enum(sortFields),
  value: z.union([z.string(), z.number()]),
  version: z.literal(1),
});

function invalidCursor(): ApiError {
  return new ApiError(400, 'INVALID_CURSOR', 'Invalid pagination cursor', [
    {
      path: 'cursor',
      message: 'Cursor is malformed or does not match sorting',
    },
  ]);
}

export function encodeCursor(cursor: PaginationCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(value: string): PaginationCursor {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw invalidCursor();
  }

  try {
    return cursorSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
    );
  } catch {
    throw invalidCursor();
  }
}

export function directoryFilterKey(query: FacetsQuery): string {
  const normalize = (values: string[]) =>
    values.map((value) => value.toLowerCase()).sort();

  return createHash('sha256')
    .update(
      JSON.stringify([
        query.q?.toLowerCase() ?? '',
        normalize(query.hobbies),
        normalize(query.nationalities),
      ]),
    )
    .digest('base64url');
}

export function parseUsersQuery(query: unknown): UserDirectoryQuery {
  const parsed = usersQuerySchema.parse(query);
  const cursor = parsed.cursor ? decodeCursor(parsed.cursor) : undefined;

  if (
    cursor &&
    (cursor.sort !== parsed.sort ||
      cursor.direction !== parsed.direction ||
      cursor.filters !== directoryFilterKey(parsed) ||
      (parsed.sort === 'age'
        ? typeof cursor.value !== 'number'
        : typeof cursor.value !== 'string'))
  ) {
    throw invalidCursor();
  }

  return {
    q: parsed.q,
    hobbies: parsed.hobbies,
    nationalities: parsed.nationalities,
    sort: parsed.sort,
    direction: parsed.direction,
    limit: parsed.limit,
    cursor,
  };
}

export function parseFacetsQuery(query: unknown): FacetsQuery {
  return baseQuerySchema.parse(query);
}
