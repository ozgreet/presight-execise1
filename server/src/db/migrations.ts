import type Database from 'better-sqlite3';

import { schema } from './schema.js';

type Migration = {
  name: string;
  up: string;
  version: number;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_user_directory',
    up: schema,
  },
];

export function migrateDatabase(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedVersions = new Set(
    (
      database
        .prepare('SELECT version FROM schema_migrations ORDER BY version')
        .all() as Array<{ version: number }>
    ).map(({ version }) => version),
  );

  const applyMigration = database.transaction((migration: Migration) => {
    database.exec(migration.up);
    database
      .prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
      .run(migration.version, migration.name);
  });

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      applyMigration(migration);
    }
  }
}
