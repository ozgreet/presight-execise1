import { openDatabase, resolveDatabasePath } from './database.js';

const databasePath = resolveDatabasePath();
const database = openDatabase(databasePath);
const migrationCount = database
  .prepare('SELECT COUNT(*) AS count FROM schema_migrations')
  .get() as { count: number };

database.close();
process.stdout.write(
  `Database ready at ${databasePath} with ${migrationCount.count} migration(s)\n`,
);
