export const sortFields = [
  'first_name',
  'last_name',
  'age',
  'nationality',
] as const;

export const sortDirections = ['asc', 'desc'] as const;

export type SortField = (typeof sortFields)[number];
export type SortDirection = (typeof sortDirections)[number];

export type PaginationCursor = {
  direction: SortDirection;
  filters: string;
  id: number;
  sort: SortField;
  value: number | string;
  version: 1;
};

export type UserDirectoryQuery = {
  cursor?: PaginationCursor;
  direction: SortDirection;
  hobbies: string[];
  limit: number;
  nationalities: string[];
  q?: string;
  sort: SortField;
};

export type FacetsQuery = Pick<
  UserDirectoryQuery,
  'hobbies' | 'nationalities' | 'q'
>;

export type UserRecord = {
  age: number;
  avatar: string;
  first_name: string;
  hobbies: string[];
  id: number;
  last_name: string;
  nationality: string;
};

export type PaginationMetadata = {
  hasMore: boolean;
  limit: number;
  nextCursor: string | null;
};

export type UsersResponse = {
  pagination: PaginationMetadata;
  users: UserRecord[];
};

export type FacetValue = {
  count: number;
  value: string;
};

export type FacetsResponse = {
  hobbies: FacetValue[];
  nationalities: FacetValue[];
};

export type ApiErrorDetail = {
  message: string;
  path: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    details?: ApiErrorDetail[];
    message: string;
  };
  requestId: string;
};
