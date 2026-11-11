import { describe, expect, it } from "vitest";
import {
  AppError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "./AppError.js";

describe("AppError", () => {
  it("uses default status and code", () => {
    const error = new AppError("Something went wrong");

    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("accepts custom options", () => {
    const error = new AppError("Bad input", {
      statusCode: 422,
      code: "UNPROCESSABLE",
      details: { field: "email" },
    });

    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("UNPROCESSABLE");
    expect(error.details).toEqual({ field: "email" });
  });
});

describe("ValidationError", () => {
  it("maps to 400 with validation code", () => {
    const error = new ValidationError("Invalid payload", [{ path: "page" }]);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([{ path: "page" }]);
  });
});

describe("NotFoundError", () => {
  it("maps to 404", () => {
    const error = new NotFoundError();

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });
});

describe("ServiceUnavailableError", () => {
  it("maps to 503 and preserves cause", () => {
    const cause = new Error("db down");
    const error = new ServiceUnavailableError("Unavailable", cause);

    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.cause).toBe(cause);
  });
});
