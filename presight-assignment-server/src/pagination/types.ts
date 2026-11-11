export type SortDirection = "asc" | "desc";

export type SortOrder = {
  property: string;
  direction: SortDirection;
  ignoreCase?: boolean;
};

export type Sort = {
  orders: SortOrder[];
};

/**
 * Spring-style page request. Page index is zero-based internally.
 */
export type Pageable = {
  page: number;
  size: number;
  sort: Sort;
};

export type PageMetadata = {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
};

/**
 * Spring Data Page equivalent.
 */
export type Page<T> = {
  content: T[];
  page: PageMetadata;
};

export type SqlFragment = {
  sql: string;
  values: unknown[];
};

export type ColumnMapping = Record<string, string>;
