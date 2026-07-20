import { z } from 'zod';

export const sortFields = [
  'first_name',
  'last_name',
  'age',
  'nationality',
] as const;

export const sortDirections = ['asc', 'desc'] as const;

export type SortField = (typeof sortFields)[number];
export type SortDirection = (typeof sortDirections)[number];

export type DirectoryState = {
  direction: SortDirection;
  hobbies: string[];
  nationalities: string[];
  q: string;
  sort: SortField;
};

export const defaultDirectoryState: DirectoryState = {
  q: '',
  hobbies: [],
  nationalities: [],
  sort: 'last_name',
  direction: 'asc',
};

const sortFieldSchema = z.enum(sortFields);
const sortDirectionSchema = z.enum(sortDirections);
const textSchema = z.string().max(100);
const filterValueSchema = z.string().trim().min(1).max(100);

function compareValues(left: string, right: string): number {
  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();

  if (normalizedLeft !== normalizedRight) {
    return normalizedLeft < normalizedRight ? -1 : 1;
  }

  return left === right ? 0 : left < right ? -1 : 1;
}

function normalizeFilterValues(values: string[]): string[] {
  const uniqueValues = new Map<string, string>();

  for (const candidate of values) {
    const parsedValue = filterValueSchema.safeParse(candidate);

    if (parsedValue.success) {
      uniqueValues.set(parsedValue.data.toLowerCase(), parsedValue.data);
    }
  }

  return [...uniqueValues.values()].sort(compareValues).slice(0, 20);
}

function parseFilterValues(
  searchParams: URLSearchParams,
  key: 'hobbies' | 'nationalities',
): string[] {
  return normalizeFilterValues(
    searchParams.getAll(key).flatMap((value) => value.split(',')),
  );
}

export function parseDirectoryState(
  searchParams: URLSearchParams,
): DirectoryState {
  const parsedQuery = textSchema.safeParse(searchParams.get('q') ?? '');
  const parsedSort = sortFieldSchema.safeParse(searchParams.get('sort'));
  const parsedDirection = sortDirectionSchema.safeParse(
    searchParams.get('direction'),
  );

  return {
    q: parsedQuery.success ? parsedQuery.data : defaultDirectoryState.q,
    hobbies: parseFilterValues(searchParams, 'hobbies'),
    nationalities: parseFilterValues(searchParams, 'nationalities'),
    sort: parsedSort.success ? parsedSort.data : defaultDirectoryState.sort,
    direction: parsedDirection.success
      ? parsedDirection.data
      : defaultDirectoryState.direction,
  };
}

export function serializeDirectoryState(
  state: DirectoryState,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const hobbies = normalizeFilterValues(state.hobbies);
  const nationalities = normalizeFilterValues(state.nationalities);

  if (state.q.trim()) {
    searchParams.set('q', state.q);
  }

  for (const hobby of hobbies) {
    searchParams.append('hobbies', hobby);
  }

  for (const nationality of nationalities) {
    searchParams.append('nationalities', nationality);
  }

  if (state.sort !== defaultDirectoryState.sort) {
    searchParams.set('sort', state.sort);
  }

  if (state.direction !== defaultDirectoryState.direction) {
    searchParams.set('direction', state.direction);
  }

  return searchParams;
}

export function directoryStateKey(state: DirectoryState): string {
  return serializeDirectoryState(state).toString();
}
