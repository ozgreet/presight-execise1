import { Sorts } from "./sort.js";
import type { Pageable, Sort as SortType } from "./types.js";

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

export type PageableDefaults = {
  page?: number;
  size?: number;
  sort?: SortType;
  maxSize?: number;
};

export const PageRequest = {
  of(page: number, size: number, sort: SortType): Pageable {
    return {
      page: Math.max(0, page),
      size: clampSize(size, MAX_SIZE),
      sort,
    };
  },

  fromQuery(
    query: {
      page?: number;
      size?: number;
      sort: SortType;
    },
    defaults: PageableDefaults = {},
  ): Pageable {
    const maxSize = defaults.maxSize ?? MAX_SIZE;
    const page = query.page ?? defaults.page ?? DEFAULT_PAGE;
    const size = clampSize(query.size ?? defaults.size ?? DEFAULT_SIZE, maxSize);
    const sort = query.sort ?? defaults.sort ?? Sorts.unpaged();

    return PageRequest.of(page, size, sort);
  },

  unpaged(sort: SortType = Sorts.unpaged()): Pageable {
    return PageRequest.of(0, MAX_SIZE, sort);
  },
};

function clampSize(size: number, maxSize: number): number {
  return Math.min(Math.max(1, size), maxSize);
}
