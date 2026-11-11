import type { SqlFragment } from "./types.js";

export class SqlBuilder {
  private clauses: string[] = [];
  private values: unknown[] = [];
  private nextIndex = 1;

  static empty(): SqlBuilder {
    return new SqlBuilder();
  }

  static from(fragment: SqlFragment | null | undefined): SqlBuilder {
    const builder = SqlBuilder.empty();
    if (fragment) {
      builder.merge(fragment);
    }
    return builder;
  }

  and(fragment: SqlFragment | null | undefined): this {
    if (!fragment?.sql) {
      return this;
    }

    this.clauses.push(fragment.sql);
    this.values.push(...fragment.values);
    this.nextIndex += fragment.values.length;
    return this;
  }

  andEquals(column: string, value: unknown): this {
    return this.and({
      sql: `${column} = ${this.placeholder()}`,
      values: [value],
    });
  }

  andIn(column: string, values: unknown[]): this {
    if (values.length === 0) {
      return this;
    }

    const placeholders = values.map(() => this.placeholder()).join(", ");
    return this.and({
      sql: `${column} IN (${placeholders})`,
      values,
    });
  }

  andIlike(column: string, value: string): this {
    return this.and({
      sql: `${column} ILIKE ${this.placeholder()}`,
      values: [`%${value}%`],
    });
  }

  andGroup(build: (builder: SqlBuilder) => void): this {
    const nested = SqlBuilder.empty();
    build(nested);
    const fragment = nested.build();
    if (!fragment) {
      return this;
    }

    return this.and({
      sql: `(${fragment.sql})`,
      values: fragment.values,
    });
  }

  or(fragment: SqlFragment | null | undefined): this {
    if (!fragment?.sql) {
      return this;
    }

    if (this.clauses.length === 0) {
      return this.and(fragment);
    }

    const lastClause = this.clauses.pop()!;
    const merged = {
      sql: `(${lastClause}) OR (${fragment.sql})`,
      values: [...this.values.slice(-countPlaceholders(lastClause)), ...fragment.values],
    };

    this.values = [
      ...this.values.slice(0, this.values.length - countPlaceholders(lastClause)),
      ...merged.values,
    ];
    this.clauses.push(merged.sql);
    return this;
  }

  merge(fragment: SqlFragment): this {
    this.clauses.push(fragment.sql);
    this.values.push(...fragment.values);
    this.nextIndex += fragment.values.length;
    return this;
  }

  build(): SqlFragment | null {
    if (this.clauses.length === 0) {
      return null;
    }

    return {
      sql: this.clauses.join(" AND "),
      values: this.values,
    };
  }

  buildWhere(): SqlFragment | null {
    const fragment = this.build();
    if (!fragment) {
      return null;
    }

    return {
      sql: `WHERE ${fragment.sql}`,
      values: fragment.values,
    };
  }

  private placeholder(): string {
    const placeholder = `$${this.nextIndex}`;
    this.nextIndex += 1;
    return placeholder;
  }
}

function countPlaceholders(clause: string): number {
  return (clause.match(/\$\d+/g) ?? []).length;
}
