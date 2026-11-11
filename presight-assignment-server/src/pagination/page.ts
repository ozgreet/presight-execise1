import type { Page, Pageable, PageMetadata } from "./types.js";

function createPageMetadata(pageable: Pageable, totalElements: number): PageMetadata {
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageable.size);
  const isFirst = pageable.page === 0;
  const isLast = totalPages === 0 || pageable.page >= totalPages - 1;

  return {
    number: pageable.page,
    size: pageable.size,
    totalElements,
    totalPages,
    hasNext: !isLast,
    hasPrevious: !isFirst && totalPages > 0,
    isFirst,
    isLast,
  };
}

export const Paged = {
  of<T>(content: T[], pageable: Pageable, totalElements: number): Page<T> {
    return {
      content,
      page: createPageMetadata(pageable, totalElements),
    };
  },

  empty<T>(pageable: Pageable): Page<T> {
    return Paged.of([], pageable, 0);
  },

  map<T, U>(page: Page<T>, mapper: (item: T) => U): Page<U> {
    return {
      content: page.content.map(mapper),
      page: page.page,
    };
  },
};

export function getOffset(pageable: Pageable): number {
  return pageable.page * pageable.size;
}
