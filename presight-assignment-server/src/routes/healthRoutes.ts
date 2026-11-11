import { Router } from "express";
import { healthController } from "../controllers/healthController.js";

export const healthRoutes = Router();

healthRoutes.get("/healthz", healthController.healthz);
healthRoutes.get("/readyz", healthController.readyz);
