import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openDatabase } from './database.js';
import {
  resetAndSeedDatabase,
  SEED_VALUE,
  seedDatabaseIfEmpty,
  USER_COUNT,
  type SeedSummary,
} from './seed-database.js';

function databaseDigest(database: Database.Database): string {
  const hash = createHash('sha256');
  const users = database
    .prepare(
      'SELECT id, avatar, first_name, last_name, age, nationality FROM users ORDER BY id',
    )
    .iterate() as Iterable<Record<string, unknown>>;
  const relationships = database
    .prepare(
      'SELECT user_id, hobby_id FROM user_hobbies ORDER BY user_id, hobby_id',
    )
    .iterate() as Iterable<Record<string, unknown>>;

  for (const user of users) {
    hash.update(JSON.stringify(user));
  }

  for (const relationship of relationships) {
    hash.update(JSON.stringify(relationship));
  }

  return hash.digest('hex');
}

describe('deterministic database seed', () => {
  const directory = mkdtempSync(join(tmpdir(), 'presight-seed-'));
  const databasePath = join(directory, 'seed.sqlite');
  let database: Database.Database;
  let summary: SeedSummary;

  beforeAll(() => {
    database = openDatabase(databasePath);
    summary = resetAndSeedDatabase(database);
  });

  afterAll(() => {
    database.close();
    rmSync(directory, { force: true, recursive: true });
  });

  it('persists the generated users to SQLite', () => {
    database.close();
    database = openDatabase(databasePath);

    const result = database
      .prepare('SELECT COUNT(*) AS count FROM users')
      .get() as {
      count: number;
    };

    expect(result.count).toBe(USER_COUNT);
  });

  it('creates users with zero hobbies', () => {
    expect(summary.usersWithZeroHobbies).toBeGreaterThan(0);
  });

  it('creates users with multiple hobbies', () => {
    const result = database
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM (
          SELECT user_id
          FROM user_hobbies
          GROUP BY user_id
          HAVING COUNT(*) > 1
        )
      `,
      )
      .get() as { count: number };

    expect(result.count).toBeGreaterThan(0);
  });

  it('never creates more than ten hobbies for one user', () => {
    const result = database
      .prepare(
        `
        SELECT COALESCE(MAX(hobby_count), 0) AS maximum
        FROM (
          SELECT COUNT(*) AS hobby_count
          FROM user_hobbies
          GROUP BY user_id
        )
      `,
      )
      .get() as { maximum: number };

    expect(result.maximum).toBeLessThanOrEqual(10);
  });

  it('creates valid junction-table relationships', () => {
    const foreignKeyErrors = database.pragma('foreign_key_check');
    const result = database
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM user_hobbies AS uh
        LEFT JOIN users AS u ON u.id = uh.user_id
        LEFT JOIN hobbies AS h ON h.id = uh.hobby_id
        WHERE u.id IS NULL OR h.id IS NULL
      `,
      )
      .get() as { count: number };

    expect(foreignKeyErrors).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('uses realistic adult ages', () => {
    const result = database
      .prepare('SELECT MIN(age) AS minimum, MAX(age) AS maximum FROM users')
      .get() as { maximum: number; minimum: number };

    expect(result.minimum).toBeGreaterThanOrEqual(18);
    expect(result.maximum).toBeLessThanOrEqual(85);
  });

  it('does not replace data when the database is already populated', () => {
    const firstName = database
      .prepare('SELECT first_name FROM users WHERE id = 1')
      .pluck()
      .get() as string;
    database
      .prepare("UPDATE users SET first_name = 'Persisted' WHERE id = 1")
      .run();

    expect(seedDatabaseIfEmpty(database)).toBeNull();
    expect(
      database
        .prepare('SELECT first_name FROM users WHERE id = 1')
        .pluck()
        .get(),
    ).toBe('Persisted');
    database
      .prepare('UPDATE users SET first_name = ? WHERE id = 1')
      .run(firstName);
  });

  it('recreates identical data from the fixed seed', () => {
    const firstDigest = databaseDigest(database);
    const secondSummary = resetAndSeedDatabase(
      database,
      SEED_VALUE,
      USER_COUNT,
    );
    const secondDigest = databaseDigest(database);

    expect(secondSummary).toEqual(summary);
    expect(secondDigest).toBe(firstDigest);
  });
});
