import type Database from 'better-sqlite3';

export const SEED_VALUE = 20_260_719;
export const USER_COUNT = 5_000;

const firstNames = [
  'Aarav',
  'Aisha',
  'Alejandro',
  'Amara',
  'Amina',
  'Ana',
  'Carlos',
  'Chloe',
  'Daniel',
  'Diego',
  'Elena',
  'Emma',
  'Fatima',
  'Gabriel',
  'Hana',
  'Haruto',
  'Hugo',
  'Iris',
  'Isabella',
  'Jonas',
  'Kenji',
  'Laila',
  'Leila',
  'Liam',
  'Lucas',
  'Mateo',
  'Maya',
  'Mei',
  'Mia',
  'Nadia',
  'Noah',
  'Nora',
  'Oliver',
  'Priya',
  'Samuel',
  'Sara',
  'Sofia',
  'Theo',
  'Yara',
  'Zain',
];

const lastNames = [
  'Abadi',
  'Anders',
  'Bennett',
  'Brown',
  'Chen',
  'Costa',
  'Diallo',
  'Dubois',
  'Fernandez',
  'Garcia',
  'Gupta',
  'Haddad',
  'Hansen',
  'Ivanov',
  'Johnson',
  'Khan',
  'Kim',
  'Kobayashi',
  'Kowalski',
  'Lee',
  'Martin',
  'Mensah',
  'Miller',
  'Muller',
  'Nakamura',
  'Nguyen',
  'Novak',
  'Patel',
  'Petrov',
  'Rossi',
  'Santos',
  'Silva',
  'Singh',
  'Smith',
  'Svensson',
  'Tanaka',
  'Taylor',
  'Thomas',
  'Walker',
  'Wilson',
];

const nationalities = [
  'Argentina',
  'Australia',
  'Brazil',
  'Canada',
  'China',
  'Colombia',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Ghana',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Poland',
  'Portugal',
  'South Korea',
  'Spain',
  'Sweden',
];

const hobbies = [
  'Archery',
  'Baking',
  'Birdwatching',
  'Board games',
  'Calligraphy',
  'Camping',
  'Chess',
  'Climbing',
  'Coding',
  'Cooking',
  'Cycling',
  'Dancing',
  'Drawing',
  'Fishing',
  'Gardening',
  'Hiking',
  'Kayaking',
  'Knitting',
  'Language learning',
  'Martial arts',
  'Meditation',
  'Movies',
  'Music',
  'Painting',
  'Photography',
  'Pilates',
  'Pottery',
  'Puzzles',
  'Reading',
  'Robotics',
  'Running',
  'Sailing',
  'Sculpting',
  'Skiing',
  'Soccer',
  'Surfing',
  'Swimming',
  'Table tennis',
  'Tennis',
  'Theater',
  'Travel',
  'Video games',
  'Volunteering',
  'Walking',
  'Woodworking',
  'Writing',
  'Yoga',
  'Astronomy',
  'Basketball',
  'Podcasts',
];

export type SeedSummary = {
  hobbies: number;
  nationalities: number;
  relationships: number;
  seed: number;
  users: number;
  usersWithZeroHobbies: number;
};

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(values: readonly T[], random: () => number): T {
  const value = values[Math.floor(random() * values.length)];

  if (value === undefined) {
    throw new Error('Cannot select from an empty seed collection');
  }

  return value;
}

export function resetAndSeedDatabase(
  database: Database.Database,
  seed = SEED_VALUE,
  userCount = USER_COUNT,
): SeedSummary {
  const random = createRandom(seed);
  const insertHobby = database.prepare(
    'INSERT INTO hobbies (id, name) VALUES (?, ?)',
  );
  const insertUser = database.prepare(`
    INSERT INTO users (id, avatar, first_name, last_name, age, nationality)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertUserHobby = database.prepare(
    'INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)',
  );

  database.transaction(() => {
    database.prepare('DELETE FROM user_hobbies').run();
    database.prepare('DELETE FROM users').run();
    database.prepare('DELETE FROM hobbies').run();

    hobbies.forEach((hobby, index) => {
      insertHobby.run(index + 1, hobby);
    });

    for (let id = 1; id <= userCount; id += 1) {
      const firstName = pick(firstNames, random);
      const lastName = pick(lastNames, random);
      const nationality = pick(nationalities, random);
      const age = 18 + Math.floor(random() * 68);
      const hobbyCount = Math.floor(random() * 11);
      const hobbyIds = new Set<number>();

      insertUser.run(
        id,
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(`user-${id}-${firstName}-${lastName}`)}`,
        firstName,
        lastName,
        age,
        nationality,
      );

      while (hobbyIds.size < hobbyCount) {
        hobbyIds.add(1 + Math.floor(random() * hobbies.length));
      }

      for (const hobbyId of hobbyIds) {
        insertUserHobby.run(id, hobbyId);
      }
    }
  })();

  const summary = database
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM hobbies) AS hobbies,
        (SELECT COUNT(DISTINCT nationality) FROM users) AS nationalities,
        (SELECT COUNT(*) FROM user_hobbies) AS relationships,
        (
          SELECT COUNT(*)
          FROM users
          WHERE NOT EXISTS (
            SELECT 1
            FROM user_hobbies
            WHERE user_hobbies.user_id = users.id
          )
        ) AS usersWithZeroHobbies
    `,
    )
    .get() as Omit<SeedSummary, 'seed'>;

  return { ...summary, seed };
}

export function seedDatabaseIfEmpty(
  database: Database.Database,
): SeedSummary | null {
  return database
    .transaction(() => {
      const { users } = database
        .prepare('SELECT COUNT(*) AS users FROM users')
        .get() as { users: number };

      return users === 0 ? resetAndSeedDatabase(database) : null;
    })
    .immediate();
}
