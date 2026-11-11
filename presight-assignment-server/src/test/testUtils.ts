import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";

type MockResponse = Response & {
  statusCode: number;
  body: unknown;
  locals: Record<string, unknown>;
};

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    method: "GET",
    originalUrl: "/",
    ...overrides,
  } as Request;
}

export function createMockResponse(): MockResponse {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    locals: {} as Record<string, unknown>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as MockResponse;
}

export function createMockNext(): NextFunction {
  return vi.fn();
}
