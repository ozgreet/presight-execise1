import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { getOverview } = vi.hoisted(() => ({
  getOverview: vi.fn(),
}));

vi.mock("./services/userService.js", () => ({
  userService: { listUsers: vi.fn() },
}));

vi.mock("./services/facetService.js", () => ({
  facetService: { getFacets: vi.fn() },
}));

vi.mock("./services/insightsService.js", () => ({
  insightsService: { getOverview },
}));

const { createApp } = await import("./app.js");

describe("insights routes", () => {
  beforeEach(() => {
    getOverview.mockReset();
  });

  it("GET /api/insights returns directory overview stats", async () => {
    getOverview.mockResolvedValue({
      totalPeople: 5000,
      nationalityCount: 30,
      hobbyCount: 40,
      medianAge: 49,
      filtered: false,
      topNationalities: [{ value: "American", count: 180 }],
      topHobbies: [{ value: "Reading", count: 620 }],
      ageDistribution: [{ label: "25–34", min: 25, max: 34, count: 900 }],
    });

    const response = await request(createApp()).get("/api/insights");

    expect(response.status).toBe(200);
    expect(response.body.totalPeople).toBe(5000);
    expect(response.body.filtered).toBe(false);
    expect(getOverview).toHaveBeenCalledWith({
      q: undefined,
      nationalities: [],
      hobbies: [],
    });
  });

  it("GET /api/insights returns filtered overview stats", async () => {
    getOverview.mockResolvedValue({
      totalPeople: 42,
      nationalityCount: 3,
      hobbyCount: 8,
      medianAge: 31,
      filtered: true,
      topNationalities: [{ value: "Japanese", count: 18 }],
      topHobbies: [{ value: "Photography", count: 12 }],
      ageDistribution: [{ label: "25–34", min: 25, max: 34, count: 20 }],
    });

    const response = await request(createApp()).get(
      "/api/insights?q=tan&nationalities=Japanese&hobbies=Photography",
    );

    expect(response.status).toBe(200);
    expect(response.body.totalPeople).toBe(42);
    expect(response.body.filtered).toBe(true);
    expect(getOverview).toHaveBeenCalledWith({
      q: "tan",
      nationalities: ["Japanese"],
      hobbies: ["Photography"],
    });
  });
});
