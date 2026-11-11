import type { Response } from "express";
import type { FacetsQueryInput, UsersListQueryInput } from "../schemas/usersQuery.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { facetService } from "../services/facetService.js";
import { userService } from "../services/userService.js";

export const usersController = {
  list: asyncHandler(async (req, res: Response) => {
    const query = res.locals.validatedQuery as UsersListQueryInput;
    const result = await userService.listUsers(query.pageable, query.filters);
    res.status(200).json(result);
  }),
};

export const facetsController = {
  list: asyncHandler(async (req, res: Response) => {
    const query = res.locals.validatedQuery as FacetsQueryInput;
    const result = await facetService.getFacets(query);
    res.status(200).json(result);
  }),
};
