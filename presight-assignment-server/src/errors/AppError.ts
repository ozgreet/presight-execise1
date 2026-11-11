export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      isOperational?: boolean;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", cause?: unknown) {
    super(message, {
      statusCode: 503,
      code: "SERVICE_UNAVAILABLE",
      cause,
    });
  }
}
