import type Database from 'better-sqlite3';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { resetAndSeedDatabase } from './db/seed-database.js';
import type { ApiErrorResponse, UsersResponse } from './users/types.js';

describe('HTTP API', () => {
  let app: Express;
  let database: Database.Database;

  beforeAll(() => {
    database = openDatabase(':memory:');
    resetAndSeedDatabase(database);
    app = createApp(database);
  });

  afterAll(() => {
    database.close();
  });

  it('reports API health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('applies user query defaults', async () => {
    const response = await request(app).get('/api/users');
    const body = response.body as UsersResponse;

    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(40);
    expect(body.pagination).toMatchObject({
      limit: 40,
      hasMore: true,
    });
    expect(body.pagination.nextCursor).toEqual(expect.any(String));
    expect(body.users[0]).toEqual({
      id: expect.any(Number),
      avatar: expect.any(String),
      first_name: expect.any(String),
      last_name: expect.any(String),
      age: expect.any(Number),
      nationality: expect.any(String),
      hobbies: expect.any(Array),
    });
  });

  it.each([
    ['sort', 'unknown'],
    ['direction', 'sideways'],
    ['limit', '0'],
    ['limit', '101'],
    ['limit', '2.5'],
  ])('rejects invalid %s values', async (parameter, value) => {
    const response = await request(app)
      .get('/api/users')
      .query({ [parameter]: value });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: 'INVALID_QUERY',
        message: 'Invalid query parameters',
        details: expect.any(Array),
      },
      requestId: expect.any(String),
    });
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });

  it('normalizes repeated and comma-separated filters', async () => {
    const repeated = await request(app).get(
      '/api/users?hobbies=Chess&hobbies=Cooking%2CReading&nationalities=Canada&nationalities=Japan%2CSpain&limit=100',
    );
    const commaSeparated = await request(app).get(
      '/api/users?hobbies=Chess%2CCooking%2CReading&nationalities=Canada%2CJapan%2CSpain&limit=100',
    );

    expect(repeated.status).toBe(200);
    expect(commaSeparated.status).toBe(200);
    expect(repeated.body).toEqual(commaSeparated.body);
  });

  it('treats an empty text query as absent', async () => {
    const defaultResponse = await request(app).get('/api/users');
    const emptyQueryResponse = await request(app).get('/api/users?q=%20%20%20');

    expect(emptyQueryResponse.status).toBe(200);
    expect(emptyQueryResponse.body).toEqual(defaultResponse.body);
  });

  it('rejects malformed pagination cursors', async () => {
    const response = await request(app)
      .get('/api/users')
      .query({ cursor: 'not-a-valid-cursor' });
    const body = response.body as ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'INVALID_CURSOR',
        message: 'Invalid pagination cursor',
        details: [
          {
            path: 'cursor',
            message: 'Cursor is malformed or does not match sorting',
          },
        ],
      },
      requestId: expect.any(String),
    });
  });

  it('rejects cursors reused with different sorting or filters', async () => {
    const firstResponse = await request(app).get(
      '/api/users?q=Maya&sort=age&direction=desc&limit=10',
    );
    const firstBody = firstResponse.body as UsersResponse;

    for (const query of [
      {
        q: 'Maya',
        sort: 'age',
        direction: 'asc',
        cursor: firstBody.pagination.nextCursor,
      },
      {
        q: 'Ana',
        sort: 'age',
        direction: 'desc',
        cursor: firstBody.pagination.nextCursor,
      },
    ]) {
      const response = await request(app).get('/api/users').query(query);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CURSOR');
    }
  });

  it('uses the returned cursor to fetch a distinct next page', async () => {
    const firstResponse = await request(app).get('/api/users?limit=10');
    const firstBody = firstResponse.body as UsersResponse;
    const secondResponse = await request(app)
      .get('/api/users')
      .query({ limit: 10, cursor: firstBody.pagination.nextCursor });
    const secondBody = secondResponse.body as UsersResponse;
    const firstIds = new Set(firstBody.users.map(({ id }) => id));

    expect(secondResponse.status).toBe(200);
    expect(secondBody.users).toHaveLength(10);
    expect(secondBody.users.every(({ id }) => !firstIds.has(id))).toBe(true);
  });

  it('returns no more than twenty contextual facet values', async () => {
    const response = await request(app).get('/api/users/facets?q=a');

    expect(response.status).toBe(200);
    expect(response.body.hobbies.length).toBeLessThanOrEqual(20);
    expect(response.body.nationalities.length).toBeLessThanOrEqual(20);
    expect(response.body.hobbies[0]).toEqual({
      value: expect.any(String),
      count: expect.any(Number),
    });
  });

  it('uses the consistent error shape for missing routes', async () => {
    const response = await request(app)
      .get('/api/missing')
      .set('x-request-id', 'test-request-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
      requestId: 'test-request-id',
    });
  });

  it('replaces unsafe request identifiers', async () => {
    const response = await request(app)
      .get('/api/missing')
      .set('x-request-id', 'unsafe request id');

    expect(response.status).toBe(404);
    expect(response.body.requestId).not.toBe('unsafe request id');
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });
});
