import { describe, expect, it, vi } from "vitest";
import { AppError, ValidationError } from "../errors/index.js";
import { errorHandler, notFoundHandler } from "./errorHandler.js";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from "../test/testUtils.js";

describe("notFoundHandler", () => {
  it("forwards a 404 AppError", () => {
    const next = createMockNext();

    notFoundHandler(createMockRequest(), createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as ReturnType<typeof createMockNext>).mock.calls[0]?.[0] as AppError;
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("ROUTE_NOT_FOUND");
  });
});

describe("errorHandler", () => {
  it("formats operational AppError responses", () => {
    const res = createMockResponse();
    const error = new ValidationError("Invalid", [{ path: "q" }]);

    errorHandler(error, createMockRequest(), res, createMockNext());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: {
        message: "Invalid",
        code: "VALIDATION_ERROR",
        details: [{ path: "q" }],
      },
    });
  });

  it("hides unexpected errors behind a 500 response", () => {
    const res = createMockResponse();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("boom"), createMockRequest(), res, createMockNext());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    });

    consoleError.mockRestore();
  });
});
