import {
  Specification,
  whereIlikeAny,
  whereIn,
  type Specification as SpecificationInterface,
} from "../pagination/specification.js";
import type { UserFilters } from "../types/user.js";

export const USER_SORT_COLUMN_MAP = {
  first_name: "first_name",
  last_name: "last_name",
  age: "age",
  nationality: "nationality",
  id: "id",
} as const;

export const USER_SORT_FIELDS = Object.keys(USER_SORT_COLUMN_MAP).filter(
  (field) => field !== "id",
) as Array<Exclude<keyof typeof USER_SORT_COLUMN_MAP, "id">>;

export function whereHasAllHobbies(
  userAlias: string,
  hobbies: string[],
): SpecificationInterface {
  return {
    toSql() {
      if (hobbies.length === 0) {
        return null;
      }

      const hobbyPlaceholders = hobbies.map((_, index) => `$${index + 1}`).join(", ");

      return {
        sql: `(
          SELECT COUNT(DISTINCT h.name)
          FROM user_hobbies uh
          JOIN hobbies h ON h.id = uh.hobby_id
          WHERE uh.user_id = ${userAlias}.id
            AND h.name IN (${hobbyPlaceholders})
        ) = $${hobbies.length + 1}`,
        values: [...hobbies, hobbies.length],
      };
    },
  };
}

export function buildUserFilterSpecification(
  filters: UserFilters,
  userAlias = "u",
): SpecificationInterface {
  return Specification.all(
    whereIlikeAny([`${userAlias}.first_name`, `${userAlias}.last_name`], filters.q),
    whereIn(`${userAlias}.nationality`, filters.nationalities),
    whereHasAllHobbies(userAlias, filters.hobbies),
  );
}

export function buildNationalityFacetSpecification(
  filters: UserFilters,
  userAlias = "u",
): SpecificationInterface {
  return Specification.all(
    whereIlikeAny([`${userAlias}.first_name`, `${userAlias}.last_name`], filters.q),
    whereHasAllHobbies(userAlias, filters.hobbies),
  );
}

export function buildHobbyFacetSpecification(
  filters: UserFilters,
  userAlias = "u",
): SpecificationInterface {
  return Specification.all(
    whereIlikeAny([`${userAlias}.first_name`, `${userAlias}.last_name`], filters.q),
    whereIn(`${userAlias}.nationality`, filters.nationalities),
  );
}

export function toWhereClause(specification: SpecificationInterface): {
  sql: string;
  values: unknown[];
} {
  const fragment = specification.toSql();
  if (!fragment) {
    return { sql: "", values: [] };
  }

  return {
    sql: `WHERE ${fragment.sql}`,
    values: fragment.values,
  };
}
