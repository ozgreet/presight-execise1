import { z } from "zod";
import { appendTieBreaker, Sorts, sortOrder } from "./sort.js";
import { PageRequest } from "./pageable.js";
import type { Pageable, SortDirection } from "./types.js";

export type PageableSchemaOptions = {
  defaultPage?: number;
  defaultSize?: number;
  maxSize?: number;
  allowedSortFields: readonly string[];
  defaultSortField: string;
  defaultSortDirection?: SortDirection;
  tieBreakerField?: string;
  tieBreakerDirection?: SortDirection;
};

function parseArrayParam(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createPageableQuerySchema(options: PageableSchemaOptions) {
  const sortFieldSchema = z.enum(
    options.allowedSortFields as [string, ...string[]],
  );

  return z
    .object({
      page: z.coerce.number().int().min(1).default((options.defaultPage ?? 0) + 1),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(options.maxSize ?? 100)
        .default(options.defaultSize ?? 20),
      sort: sortFieldSchema.default(options.defaultSortField),
      order: z.enum(["asc", "desc"]).default(options.defaultSortDirection ?? "asc"),
    })
    .transform((query) => {
      let sort = Sorts.from(query.sort, query.order);

      if (options.tieBreakerField) {
        sort = appendTieBreaker(
          sort,
          sortOrder(
            options.tieBreakerField,
            options.tieBreakerDirection ?? "asc",
          ),
        );
      }

      const pageable: Pageable = PageRequest.fromQuery(
        {
          page: query.page - 1,
          size: query.limit,
          sort,
        },
        {
          maxSize: options.maxSize,
        },
      );

      return {
        pageable,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
      };
    });
}

export function createFilterQuerySchema() {
  return z.object({
    q: z.string().trim().optional(),
    nationalities: z
      .preprocess(parseArrayParam, z.array(z.string().min(1)))
      .default([]),
    hobbies: z.preprocess(parseArrayParam, z.array(z.string().min(1))).default([]),
  });
}

export type PageableQuery = z.infer<ReturnType<typeof createPageableQuerySchema>>;
export type FilterQuery = z.infer<ReturnType<typeof createFilterQuerySchema>>;
