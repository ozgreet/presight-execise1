import type { Request, Response } from "express";
import { ServiceUnavailableError } from "../errors/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { healthService } from "../services/healthService.js";

export const healthController = {
  healthz(_req: Request, res: Response) {
    res.status(200).json(healthService.getStatus());
  },

  readyz: asyncHandler(async (_req: Request, res: Response) => {
    try {
      const status = await healthService.getReadiness();
      res.status(200).json(status);
    } catch (error) {
      throw new ServiceUnavailableError("Database not ready", error);
    }
  }),
};
