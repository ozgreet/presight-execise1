import { openDatabase, resolveDatabasePath } from './database.js';
import { resetAndSeedDatabase } from './seed-database.js';

const databasePath = resolveDatabasePath();
const database = openDatabase(databasePath);
const summary = resetAndSeedDatabase(database);

database.close();

process.stdout.write(
  [
    `Database: ${databasePath}`,
    `Seed: ${summary.seed}`,
    `Users: ${summary.users}`,
    `Hobbies: ${summary.hobbies}`,
    `Nationalities: ${summary.nationalities}`,
    `User-hobby relationships: ${summary.relationships}`,
    `Users with zero hobbies: ${summary.usersWithZeroHobbies}`,
  ].join('\n') + '\n',
);
