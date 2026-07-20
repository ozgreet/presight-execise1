import type Database from 'better-sqlite3';
import { Router, type Request, type Response } from 'express';

import { parseFacetsQuery, parseUsersQuery } from './query.js';
import { findFacets, findUsers } from './repository.js';
import type { FacetsResponse, UsersResponse } from './types.js';

export function createUsersRouter(database: Database.Database): Router {
  const router = Router();

  router.get(
    '/facets',
    (request: Request, response: Response<FacetsResponse>) => {
      response.json(findFacets(database, parseFacetsQuery(request.query)));
    },
  );

  router.get('/', (request: Request, response: Response<UsersResponse>) => {
    response.json(findUsers(database, parseUsersQuery(request.query)));
  });

  return router;
}
