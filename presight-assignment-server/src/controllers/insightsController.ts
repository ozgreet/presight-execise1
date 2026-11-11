import type { Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { InsightsQueryInput } from "../schemas/insightsQuery.js";
import { insightsService } from "../services/insightsService.js";

export const insightsController = {
  overview: asyncHandler(async (_req, res: Response) => {
    const query = res.locals.validatedQuery as InsightsQueryInput;
    const result = await insightsService.getOverview(query);
    res.status(200).json(result);
  }),
};
