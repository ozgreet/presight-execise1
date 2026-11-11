import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import {
  artificialDelay,
  errorHandler,
  notFoundHandler,
  requestLogger,
} from "./middleware/index.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { apiRoutes } from "./routes/apiRoutes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use(healthRoutes);
  app.use("/api", artificialDelay(config.apiDelayMs), apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
