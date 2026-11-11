import { z } from "zod";
import {
  appendTieBreaker,
  createFilterQuerySchema,
  PageRequest,
  sortOrder,
  Sorts,
} from "../pagination/index.js";
import { USER_SORT_FIELDS } from "../users/userSpecifications.js";

function parseArrayParam(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const sortFieldSchema = z.enum(
  USER_SORT_FIELDS as [string, ...string[]],
);

const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: sortFieldSchema.default("first_name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  q: z.string().trim().optional(),
  nationalities: z
    .preprocess(parseArrayParam, z.array(z.string().min(1)))
    .default([]),
  hobbies: z.preprocess(parseArrayParam, z.array(z.string().min(1))).default([]),
});

export const usersListQuerySchema = baseListQuerySchema.transform((query) => {
  let sort = Sorts.from(query.sort, query.order);
  sort = appendTieBreaker(sort, sortOrder("id", "asc"));

  return {
    pageable: PageRequest.fromQuery({
      page: query.page - 1,
      size: query.limit,
      sort,
    }),
    filters: {
      q: query.q,
      nationalities: query.nationalities,
      hobbies: query.hobbies,
    },
  };
});

export const facetsQuerySchema = createFilterQuerySchema();

export type UsersListQueryInput = z.infer<typeof usersListQuerySchema>;
export type FacetsQueryInput = z.infer<typeof facetsQuerySchema>;
