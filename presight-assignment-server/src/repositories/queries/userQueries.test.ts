import { describe, expect, it } from "vitest";
import { applyWhereClause, userQueries } from "./userQueries.js";

describe("userQueries", () => {
  it("injects a where clause into facet SQL templates", () => {
    const sql = applyWhereClause(
      userQueries.selectTopNationalities,
      "WHERE u.nationality = $1",
    );

    expect(sql).toContain("WHERE u.nationality = $1");
    expect(sql).not.toContain("/*WHERE*/");
  });
});
