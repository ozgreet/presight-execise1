import type { FacetsQueryInput, UsersListQueryInput } from "../schemas/usersQuery.js";

declare global {
  namespace Express {
    interface Locals {
      validatedBody?: unknown;
      validatedQuery?: UsersListQueryInput | FacetsQueryInput;
      validatedParams?: unknown;
    }
  }
}

export {};
