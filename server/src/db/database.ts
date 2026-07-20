import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import Database from 'better-sqlite3';

import { config } from '../config.js';
import { migrateDatabase } from './migrations.js';

export function resolveDatabasePath(
  databasePath = config.DATABASE_PATH,
): string {
  return databasePath === ':memory:' ? databasePath : resolve(databasePath);
}

export function openDatabase(
  databasePath = config.DATABASE_PATH,
): Database.Database {
  const resolvedPath = resolveDatabasePath(databasePath);

  if (resolvedPath !== ':memory:') {
    mkdirSync(dirname(resolvedPath), { recursive: true });
  }

  const database = new Database(resolvedPath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  migrateDatabase(database);

  return database;
}
