import { beforeEach, describe, expect, it, vi } from "vitest";
import { healthService } from "./healthService.js";

const { checkDatabaseConnection } = vi.hoisted(() => ({
  checkDatabaseConnection: vi.fn(),
}));

vi.mock("../db/index.js", () => ({
  checkDatabaseConnection,
}));

describe("healthService", () => {
  beforeEach(() => {
    checkDatabaseConnection.mockReset();
  });

  it("returns success status", () => {
    expect(healthService.getStatus()).toEqual({ status: "success" });
  });

  it("returns ready when database check passes", async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    await expect(healthService.getReadiness()).resolves.toEqual({ status: "ready" });
  });

  it("propagates database errors", async () => {
    checkDatabaseConnection.mockRejectedValue(new Error("db unavailable"));

    await expect(healthService.getReadiness()).rejects.toThrow("db unavailable");
  });
});
