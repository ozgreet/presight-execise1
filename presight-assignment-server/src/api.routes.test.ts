import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { listUsers } = vi.hoisted(() => ({
  listUsers: vi.fn(),
}));

const { getFacets } = vi.hoisted(() => ({
  getFacets: vi.fn(),
}));

vi.mock("./services/userService.js", () => ({
  userService: { listUsers },
}));

vi.mock("./services/facetService.js", () => ({
  facetService: { getFacets },
}));

const { createApp } = await import("./app.js");

describe("api routes", () => {
  beforeEach(() => {
    listUsers.mockReset();
    getFacets.mockReset();
  });

  it("GET /api/users returns paginated users", async () => {
    listUsers.mockResolvedValue({
      data: [
        {
          id: 1,
          avatar: "https://example.com/1.jpg",
          first_name: "Anna",
          last_name: "Müller",
          profession: "Software Engineer",
          age: 30,
          nationality: "German",
          hobbies: ["Reading"],
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
        hasPrevious: false,
      },
    });

    const response = await request(createApp()).get(
      "/api/users?page=1&limit=20&sort=age&order=desc&q=ann&nationalities=German&hobbies=Reading",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
    expect(listUsers).toHaveBeenCalledOnce();
  });

  it("GET /api/facets returns top hobbies and nationalities", async () => {
    getFacets.mockResolvedValue({
      hobbies: [{ value: "Reading", count: 12 }],
      nationalities: [{ value: "German", count: 20 }],
    });

    const response = await request(createApp()).get(
      "/api/facets?q=ann&nationalities=German",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      hobbies: [{ value: "Reading", count: 12 }],
      nationalities: [{ value: "German", count: 20 }],
    });
    expect(getFacets).toHaveBeenCalledWith({
      q: "ann",
      nationalities: ["German"],
      hobbies: [],
    });
  });

  it("returns 400 for invalid sort field", async () => {
    const response = await request(createApp()).get("/api/users?sort=invalid");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
