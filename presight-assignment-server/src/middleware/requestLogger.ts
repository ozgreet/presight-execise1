import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const log = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (config.nodeEnv === "development") {
      console.log(`${log.method} ${log.path} ${log.statusCode} ${log.durationMs}ms`);
      return;
    }

    console.log(JSON.stringify(log));
  });

  next();
}
