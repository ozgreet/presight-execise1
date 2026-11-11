import { pool } from "../db/index.js";
import { findPage } from "../pagination/index.js";
import type { Page, Pageable } from "../pagination/types.js";
import type { FacetItem, User, UserFilters } from "../types/user.js";
import {
  buildHobbyFacetSpecification,
  buildNationalityFacetSpecification,
  buildUserFilterSpecification,
  toWhereClause,
  USER_SORT_COLUMN_MAP,
} from "../users/userSpecifications.js";
import { applyWhereClause, userQueries } from "./queries/userQueries.js";

export type UserRecord = {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  profession: string;
  age: number;
  nationality: string;
};

export const userRepository = {
  findPage(pageable: Pageable, filters: UserFilters): Promise<Page<UserRecord>> {
    return findPage<UserRecord, UserRecord>({
      pool,
      tableAlias: "u",
      from: userQueries.fromUsers,
      select: userQueries.selectUserColumns,
      specification: buildUserFilterSpecification(filters),
      pageable,
      sortColumnMap: USER_SORT_COLUMN_MAP,
      mapRow: (row) => row,
    });
  },

  async findHobbiesByUserIds(userIds: number[]): Promise<Map<number, string[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const result = await pool.query<{ user_id: number; name: string }>(
      userQueries.selectHobbiesByUserIds,
      [userIds],
    );

    const hobbiesByUserId = new Map<number, string[]>();

    for (const row of result.rows) {
      const hobbies = hobbiesByUserId.get(row.user_id) ?? [];
      hobbies.push(row.name);
      hobbiesByUserId.set(row.user_id, hobbies);
    }

    return hobbiesByUserId;
  },

  async findTopNationalities(filters: UserFilters): Promise<FacetItem[]> {
    const where = toWhereClause(buildNationalityFacetSpecification(filters));
    const sql = applyWhereClause(userQueries.selectTopNationalities, where.sql);

    const result = await pool.query<FacetItem>(sql, where.values);
    return result.rows;
  },

  async findTopHobbies(filters: UserFilters): Promise<FacetItem[]> {
    const where = toWhereClause(buildHobbyFacetSpecification(filters));
    const sql = applyWhereClause(userQueries.selectTopHobbies, where.sql);

    const result = await pool.query<FacetItem>(sql, where.values);
    return result.rows;
  },
};
