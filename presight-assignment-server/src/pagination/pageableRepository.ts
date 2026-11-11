import type { Pool, QueryResultRow } from "pg";
import { Paged, getOffset } from "./page.js";
import { toOrderByClause } from "./sort.js";
import type { Specification } from "./specification.js";
import type { ColumnMapping, Page, Pageable, SqlFragment } from "./types.js";

export type PageableQueryOptions<TRow extends QueryResultRow, TEntity> = {
  pool: Pool;
  tableAlias?: string;
  from: string;
  select: string;
  specification?: Specification;
  pageable: Pageable;
  sortColumnMap: ColumnMapping;
  mapRow: (row: TRow) => TEntity;
  countExpression?: string;
};

export async function findPage<TRow extends QueryResultRow, TEntity>(
  options: PageableQueryOptions<TRow, TEntity>,
): Promise<Page<TEntity>> {
  const where = buildWhereClause(options.specification);
  const orderBy = toOrderByClause(
    options.pageable.sort,
    options.sortColumnMap,
    options.tableAlias,
  );
  const offset = getOffset(options.pageable);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM ${options.from}
    ${where.sql}
  `;

  const dataSql = `
    SELECT ${options.select}
    FROM ${options.from}
    ${where.sql}
    ${orderBy}
    LIMIT $${where.values.length + 1}
    OFFSET $${where.values.length + 2}
  `;

  const countParams = where.values;
  const dataParams = [...where.values, options.pageable.size, offset];

  const [countResult, dataResult] = await Promise.all([
    options.pool.query<{ total: number }>(countSql, countParams),
    options.pool.query<TRow>(dataSql, dataParams),
  ]);

  const totalElements = countResult.rows[0]?.total ?? 0;
  const content = dataResult.rows.map(options.mapRow);

  return Paged.of(content, options.pageable, totalElements);
}

function buildWhereClause(specification?: Specification): SqlFragment {
  const fragment = specification?.toSql() ?? null;
  if (!fragment) {
    return { sql: "", values: [] };
  }

  return {
    sql: `WHERE ${fragment.sql}`,
    values: fragment.values,
  };
}
