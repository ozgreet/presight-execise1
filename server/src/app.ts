import type Database from 'better-sqlite3';
import express, { type Response } from 'express';

import { apiErrorHandler, notFoundHandler } from './middleware/api-error.js';
import { requestId } from './middleware/request-id.js';
import { createUsersRouter } from './users/routes.js';

export function createApp(database: Database.Database) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);

  app.get('/api/health', (_request, response: Response<{ status: 'ok' }>) => {
    database.prepare('SELECT 1').get();
    response.json({ status: 'ok' });
  });

  app.use('/api/users', createUsersRouter(database));
  app.use(notFoundHandler());
  app.use(apiErrorHandler);

  return app;
}
