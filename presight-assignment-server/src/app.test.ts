import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { getReadiness, getStatus } = vi.hoisted(() => ({
  getStatus: vi.fn(() => ({ status: "success" as const })),
  getReadiness: vi.fn(),
}));

vi.mock("./services/healthService.js", () => ({
  healthService: {
    getStatus,
    getReadiness,
  },
}));

const { createApp } = await import("./app.js");

describe("health routes", () => {
  beforeEach(() => {
    getStatus.mockClear();
    getReadiness.mockReset();
    getStatus.mockReturnValue({ status: "success" });
  });

  it("GET /healthz returns 200", async () => {
    const response = await request(createApp()).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "success" });
    expect(getStatus).toHaveBeenCalledOnce();
  });

  it("GET /readyz returns 200 when database is reachable", async () => {
    getReadiness.mockResolvedValue({ status: "ready" });

    const response = await request(createApp()).get("/readyz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ready" });
    expect(getReadiness).toHaveBeenCalledOnce();
  });

  it("GET /readyz returns 503 when database is unavailable", async () => {
    getReadiness.mockRejectedValue(new Error("connection refused"));

    const response = await request(createApp()).get("/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        message: "Database not ready",
        code: "SERVICE_UNAVAILABLE",
      },
    });
  });
});

describe("app routing", () => {
  it("returns 404 for unknown routes", async () => {
    const response = await request(createApp()).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        message: "Route not found",
        code: "ROUTE_NOT_FOUND",
      },
    });
  });
});
