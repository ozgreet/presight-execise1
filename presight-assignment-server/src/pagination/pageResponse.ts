import type { Page } from "./types.js";

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
};

/**
 * Maps an internal Spring-style Page to the public API response shape.
 * API page numbers are one-based for client ergonomics.
 */
export function toPaginatedResponse<T>(page: Page<T>): PaginatedResponse<T> {
  return {
    data: page.content,
    pagination: {
      page: page.page.number + 1,
      limit: page.page.size,
      total: page.page.totalElements,
      totalPages: page.page.totalPages,
      hasMore: page.page.hasNext,
      hasPrevious: page.page.hasPrevious,
    },
  };
}
