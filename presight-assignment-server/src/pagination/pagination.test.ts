import { describe, expect, it } from "vitest";
import { Paged, getOffset } from "./page.js";
import { PageRequest } from "./pageable.js";
import { createPageableQuerySchema } from "./pageableSchema.js";
import { toPaginatedResponse } from "./pageResponse.js";
import { Sorts, appendTieBreaker, sortOrder, toOrderByClause } from "./sort.js";
import { SqlBuilder } from "./sqlBuilder.js";
import {
  Specification,
  mergeSpecifications,
  whereIlikeAny,
  whereIn,
} from "./specification.js";

describe("PageRequest", () => {
  it("creates a zero-based pageable request", () => {
    const pageable = PageRequest.of(1, 25, Sorts.from("last_name", "desc"));

    expect(pageable).toEqual({
      page: 1,
      size: 25,
      sort: Sorts.from("last_name", "desc"),
    });
  });

  it("clamps page size to the configured maximum", () => {
    const pageable = PageRequest.fromQuery(
      { sort: Sorts.from("id", "asc"), size: 500 },
      { maxSize: 100 },
    );

    expect(pageable.size).toBe(100);
  });
});

describe("Page", () => {
  it("builds metadata for a non-empty page", () => {
    const pageable = PageRequest.of(0, 20, Sorts.from("id", "asc"));
    const page = Paged.of(["a", "b"], pageable, 45);

    expect(page.page).toEqual({
      number: 0,
      size: 20,
      totalElements: 45,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false,
      isFirst: true,
      isLast: false,
    });
    expect(getOffset(pageable)).toBe(0);
  });

  it("maps to API pagination metadata", () => {
    const pageable = PageRequest.of(1, 20, Sorts.from("id", "asc"));
    const response = toPaginatedResponse(Paged.of([], pageable, 45));

    expect(response.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
      hasMore: true,
      hasPrevious: true,
    });
  });
});

describe("Sort", () => {
  it("appends a deterministic tie-breaker once", () => {
    const sort = appendTieBreaker(Sorts.from("age", "desc"), sortOrder("id", "asc"));

    expect(sort.orders).toEqual([
      { property: "age", direction: "desc", ignoreCase: false },
      { property: "id", direction: "asc", ignoreCase: false },
    ]);
    expect(appendTieBreaker(sort, sortOrder("id", "asc"))).toBe(sort);
  });

  it("renders an order by clause using a column map", () => {
    const sql = toOrderByClause(Sorts.from("first_name", "asc"), {
      first_name: "first_name",
      id: "id",
    }, "u");

    expect(sql).toBe("ORDER BY u.first_name ASC");
  });
});

describe("Specification", () => {
  it("merges specifications with renumbered placeholders", () => {
    const fragment = mergeSpecifications(
      whereIn("nationality", ["German", "French"]),
      whereIlikeAny(["first_name", "last_name"], "ann"),
    );

    expect(fragment).toEqual({
      sql: "(nationality IN ($1, $2)) AND ((first_name ILIKE $3 OR last_name ILIKE $4))",
      values: ["German", "French", "%ann%", "%ann%"],
    });
  });

  it("combines specifications with logical OR", () => {
    const fragment = Specification.any(
      whereIn("nationality", ["German"]),
      whereIn("nationality", ["French"]),
    ).toSql();

    expect(fragment).toEqual({
      sql: "(nationality IN ($1)) OR (nationality IN ($2))",
      values: ["German", "French"],
    });
  });
});

describe("SqlBuilder", () => {
  it("builds grouped AND clauses", () => {
    const fragment = SqlBuilder.empty()
      .andIn("nationality", ["German", "French"])
      .andGroup((builder) => {
        builder.andIlike("first_name", "ann").or({
          sql: "last_name ILIKE $1",
          values: ["%ann%"],
        });
      })
      .buildWhere();

    expect(fragment?.sql).toContain("WHERE");
    expect(fragment?.values).toEqual(["German", "French", "%ann%", "%ann%"]);
  });
});

describe("createPageableQuerySchema", () => {
  const schema = createPageableQuerySchema({
    allowedSortFields: ["first_name", "last_name", "age", "nationality"],
    defaultSortField: "first_name",
    tieBreakerField: "id",
  });

  it("parses API query params into an internal pageable", () => {
    const parsed = schema.parse({
      page: "2",
      limit: "10",
      sort: "age",
      order: "desc",
    });

    expect(parsed.pageable.page).toBe(1);
    expect(parsed.pageable.size).toBe(10);
    expect(parsed.pageable.sort.orders).toEqual([
      { property: "age", direction: "desc", ignoreCase: false },
      { property: "id", direction: "asc", ignoreCase: false },
    ]);
  });
});
