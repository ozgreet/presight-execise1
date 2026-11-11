import type { RequestHandler } from "express";

export function artificialDelay(delayMs: number): RequestHandler {
  return (_req, _res, next) => {
    if (delayMs <= 0) {
      next();
      return;
    }

    setTimeout(next, delayMs);
  };
}
