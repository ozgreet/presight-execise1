import 'dotenv/config';

import { fileURLToPath } from 'node:url';

import { z } from 'zod';

const defaultDatabasePath = fileURLToPath(
  new URL('../../data/presight.sqlite', import.meta.url),
);

const configSchema = z.object({
  DATABASE_PATH: z.string().min(1).default(defaultDatabasePath),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export const config = configSchema.parse(process.env);
