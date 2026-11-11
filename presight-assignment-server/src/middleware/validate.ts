import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../errors/index.js";

type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        res.locals.validatedBody = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        res.locals.validatedQuery = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        res.locals.validatedParams = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError("Request validation failed", formatZodError(error)));
        return;
      }
      next(error);
    }
  };
}
