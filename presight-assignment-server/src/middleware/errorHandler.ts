import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/index.js";
import { config } from "../config.js";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError("Route not found", { statusCode: 404, code: "ROUTE_NOT_FOUND" }));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_ERROR";
  const message = isAppError ? error.message : "Internal server error";
  const details = isAppError ? error.details : undefined;

  if (!isAppError) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(details !== undefined ? { details } : {}),
      ...(config.nodeEnv === "development" && !isAppError && error instanceof Error
        ? { stack: error.stack }
        : {}),
    },
  });
}
