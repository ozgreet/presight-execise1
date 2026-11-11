import { pool } from "../db/index.js";
import type { InsightsOverview } from "../types/insights.js";
import type { FacetItem, UserFilters } from "../types/user.js";
import { buildUserFilterSpecification, toWhereClause } from "../users/userSpecifications.js";
import { applyWhereClause } from "./queries/userQueries.js";
import { insightsQueries } from "./queries/insightsQueries.js";

type OverviewRow = {
  total_people: number;
  nationality_count: number;
  median_age: number | null;
};

type HobbyCountRow = {
  hobby_count: number;
};

type AgeBucketRow = {
  label: string;
  min: number;
  max: number | null;
  count: number;
};

function roundMedian(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value);
}

function isFiltered(filters: UserFilters): boolean {
  return Boolean(
    filters.q?.trim() || filters.nationalities.length > 0 || filters.hobbies.length > 0,
  );
}

export const insightsRepository = {
  async getOverview(filters: UserFilters): Promise<InsightsOverview> {
    const where = toWhereClause(buildUserFilterSpecification(filters));
    const overviewSql = applyWhereClause(insightsQueries.selectOverview, where.sql);
    const hobbyCountSql = applyWhereClause(insightsQueries.selectDistinctHobbyCount, where.sql);
    const nationalitiesSql = applyWhereClause(insightsQueries.selectTopNationalities, where.sql);
    const hobbiesSql = applyWhereClause(insightsQueries.selectTopHobbies, where.sql);
    const ageSql = applyWhereClause(insightsQueries.selectAgeDistribution, where.sql);

    const [overviewResult, hobbyCountResult, nationalitiesResult, hobbiesResult, ageResult] =
      await Promise.all([
        pool.query<OverviewRow>(overviewSql, where.values),
        pool.query<HobbyCountRow>(hobbyCountSql, where.values),
        pool.query<FacetItem>(nationalitiesSql, where.values),
        pool.query<FacetItem>(hobbiesSql, where.values),
        pool.query<AgeBucketRow>(ageSql, where.values),
      ]);

    const overview = overviewResult.rows[0]!;
    const totalPeople = overview.total_people;

    return {
      totalPeople,
      nationalityCount: overview.nationality_count,
      hobbyCount: hobbyCountResult.rows[0]?.hobby_count ?? 0,
      medianAge: totalPeople > 0 ? roundMedian(overview.median_age) : null,
      filtered: isFiltered(filters),
      topNationalities: nationalitiesResult.rows,
      topHobbies: hobbiesResult.rows,
      ageDistribution: ageResult.rows.map((row) => ({
        label: row.label,
        min: row.min,
        max: row.max,
        count: row.count,
      })),
    };
  },
};
