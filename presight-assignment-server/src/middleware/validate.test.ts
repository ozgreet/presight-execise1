import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "../errors/index.js";
import { validate } from "./validate.js";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from "../test/testUtils.js";

describe("validate middleware", () => {
  it("parses and assigns validated query values", () => {
    const req = createMockRequest({ query: { page: "2" } });
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = validate({
      query: z.object({
        page: z.coerce.number().int().min(1),
      }),
    });

    middleware(req, res, next);

    expect(res.locals.validatedQuery).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledOnce();
  });

  it("forwards ValidationError when schema fails", () => {
    const req = createMockRequest({ query: { page: "0" } });
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = validate({
      query: z.object({
        page: z.coerce.number().int().min(1),
      }),
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    const error = (next as ReturnType<typeof createMockNext>).mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "page",
        }),
      ]),
    );
  });
});
