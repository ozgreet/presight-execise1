import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (request, response, next) => {
  const candidate =
    typeof request.headers['x-request-id'] === 'string' &&
    request.headers['x-request-id'].trim()
      ? request.headers['x-request-id'].trim()
      : null;
  const value =
    candidate && candidate.length <= 100 && /^[A-Za-z0-9._:-]+$/.test(candidate)
      ? candidate
      : randomUUID();

  response.locals.requestId = value;
  response.setHeader('x-request-id', value);
  next();
};
