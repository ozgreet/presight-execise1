import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';

import type { ApiErrorDetail, ApiErrorResponse } from '../users/types.js';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
  }
}

export function notFoundHandler(): RequestHandler {
  return (_request, _response, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
  };
}

function zodDetails(error: z.ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const apiErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  void _next;

  const apiError =
    error instanceof ApiError
      ? error
      : error instanceof z.ZodError
        ? new ApiError(
            400,
            'INVALID_QUERY',
            'Invalid query parameters',
            zodDetails(error),
          )
        : new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');

  const body: ApiErrorResponse = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
    requestId: response.locals.requestId as string,
  };

  response.status(apiError.status).json(body);
};
