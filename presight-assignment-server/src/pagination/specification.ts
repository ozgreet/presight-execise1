import type { SqlFragment } from "./types.js";

/**
 * Spring Data Specification equivalent for SQL WHERE clauses.
 */
export interface Specification {
  toSql(): SqlFragment | null;
}

export const Specification = {
  all(...specifications: Specification[]): Specification {
    return combineSpecifications(" AND ", ...specifications);
  },

  any(...specifications: Specification[]): Specification {
    return combineSpecifications(" OR ", ...specifications);
  },

  not(specification: Specification): Specification {
    return {
      toSql() {
        const fragment = specification.toSql();
        if (!fragment) {
          return null;
        }

        return {
          sql: `NOT (${fragment.sql})`,
          values: fragment.values,
        };
      },
    };
  },
};

export function whereEquals(column: string, value: unknown): Specification {
  return {
    toSql() {
      return {
        sql: `${column} = $1`,
        values: [value],
      };
    },
  };
}

export function whereIn(column: string, values: unknown[]): Specification {
  return {
    toSql() {
      if (values.length === 0) {
        return null;
      }

      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
      return {
        sql: `${column} IN (${placeholders})`,
        values,
      };
    },
  };
}

export function whereIlike(column: string, value: string | undefined): Specification {
  return {
    toSql() {
      if (!value?.trim()) {
        return null;
      }

      return {
        sql: `${column} ILIKE $1`,
        values: [`%${value.trim()}%`],
      };
    },
  };
}

export function whereIlikeAny(columns: string[], value: string | undefined): Specification {
  return {
    toSql() {
      if (!value?.trim()) {
        return null;
      }

      const searchValue = `%${value.trim()}%`;
      const clauses = columns.map((column, index) => `${column} ILIKE $${index + 1}`);
      return {
        sql: `(${clauses.join(" OR ")})`,
        values: columns.map(() => searchValue),
      };
    },
  };
}

/**
 * Merges independent specifications while re-numbering SQL placeholders.
 */
export function mergeSpecifications(...specifications: Specification[]): SqlFragment | null {
  return combineSpecifications(" AND ", ...specifications).toSql();
}

function combineSpecifications(
  joiner: " AND " | " OR ",
  ...specifications: Specification[]
): Specification {
  return {
    toSql() {
      const fragments = specifications
        .map((specification) => specification.toSql())
        .filter((fragment): fragment is SqlFragment => fragment !== null);

      if (fragments.length === 0) {
        return null;
      }

      let paramIndex = 1;
      const sqlParts: string[] = [];
      const values: unknown[] = [];

      for (const fragment of fragments) {
        const renumberedSql = fragment.sql.replace(/\$\d+/g, () => `$${paramIndex++}`);
        sqlParts.push(`(${renumberedSql})`);
        values.push(...fragment.values);
      }

      return {
        sql: sqlParts.join(joiner),
        values,
      };
    },
  };
}
