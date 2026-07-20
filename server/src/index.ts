import { createApp } from './app.js';
import { config } from './config.js';
import { openDatabase } from './db/database.js';
import { seedDatabaseIfEmpty } from './db/seed-database.js';

const database = openDatabase();
const seedSummary = seedDatabaseIfEmpty(database);
const app = createApp(database);

if (seedSummary) {
  process.stdout.write(`Seeded ${seedSummary.users} users\n`);
}

const server = app.listen(config.PORT, () => {
  process.stdout.write(`API listening on http://localhost:${config.PORT}\n`);
});

function shutdown(): void {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
