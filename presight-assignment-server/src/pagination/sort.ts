import { ValidationError } from "../errors/index.js";
import type { ColumnMapping, Sort, SortDirection, SortOrder } from "./types.js";

export const SortDirections = {
  ASC: "asc",
  DESC: "desc",
} as const;

export function sortOrder(
  property: string,
  direction: SortDirection = SortDirections.ASC,
  ignoreCase = false,
): SortOrder {
  return { property, direction, ignoreCase };
}

export const Sorts = {
  by(...orders: SortOrder[]): Sort {
    if (orders.length === 0) {
      throw new ValidationError("Sort must contain at least one order");
    }
    return { orders };
  },

  from(property: string, direction: SortDirection = SortDirections.ASC): Sort {
    return Sorts.by(sortOrder(property, direction));
  },

  unpaged(): Sort {
    return { orders: [] };
  },

  isUnpaged(sort: Sort): boolean {
    return sort.orders.length === 0;
  },
};

export function appendTieBreaker(sort: Sort, tieBreaker: SortOrder): Sort {
  const hasTieBreaker = sort.orders.some((order) => order.property === tieBreaker.property);
  if (hasTieBreaker) {
    return sort;
  }

  return Sorts.by(...sort.orders, tieBreaker);
}

export function toOrderByClause(
  sort: Sort,
  columnMap: ColumnMapping,
  alias?: string,
): string {
  if (Sorts.isUnpaged(sort)) {
    return "";
  }

  const prefix = alias ? `${alias}.` : "";
  const clauses = sort.orders.map((order) => {
    const column = columnMap[order.property];
    if (!column) {
      throw new ValidationError(`Unsupported sort property: ${order.property}`);
    }

    const direction = order.direction.toUpperCase();
    if (order.ignoreCase) {
      return `LOWER(${prefix}${column}) ${direction}`;
    }

    return `${prefix}${column} ${direction}`;
  });

  return `ORDER BY ${clauses.join(", ")}`;
}
