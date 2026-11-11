import "dotenv/config";
import { faker } from "@faker-js/faker";
import type { PoolClient } from "pg";
import { closePool, pool } from "./pool.js";

const HOBBIES = [
  "Reading",
  "Hiking",
  "Cooking",
  "Photography",
  "Gaming",
  "Cycling",
  "Yoga",
  "Painting",
  "Gardening",
  "Running",
  "Swimming",
  "Chess",
  "Dancing",
  "Fishing",
  "Camping",
  "Knitting",
  "Traveling",
  "Writing",
  "Singing",
  "Woodworking",
  "Birdwatching",
  "Surfing",
  "Skiing",
  "Pottery",
  "Astronomy",
  "Volunteering",
  "Meditation",
  "Baking",
  "Rock Climbing",
  "Table Tennis",
  "Calligraphy",
  "Podcasting",
  "Collecting Vinyl",
  "Learning Languages",
  "Board Games",
  "Martial Arts",
  "Scuba Diving",
  "Fashion Design",
  "Film Making",
  "Archery",
];

const PROFESSIONS = [
  "Product Designer",
  "Software Engineer",
  "Data Scientist",
  "Marketing Manager",
  "Architect",
  "Photographer",
  "Financial Analyst",
  "UX Researcher",
  "Civil Engineer",
  "Physician",
  "Teacher",
  "Journalist",
  "Chef",
  "Lawyer",
  "Sales Director",
  "Illustrator",
  "Product Manager",
  "Nurse",
  "Economist",
  "Filmmaker",
  "Mechanical Engineer",
  "Copywriter",
  "Consultant",
  "Entrepreneur",
];

const NATIONALITIES = [
  "American",
  "British",
  "Canadian",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Polish",
  "Portuguese",
  "Irish",
  "Australian",
  "Japanese",
  "South Korean",
  "Indian",
  "Brazilian",
  "Mexican",
  "Argentine",
  "South African",
  "Nigerian",
  "Egyptian",
  "Turkish",
  "Greek",
  "Swiss",
  "Belgian",
  "Austrian",
  "Finnish",
];

const USER_COUNT = Number(process.env.SEED_USER_COUNT) || 5_000;
const BATCH_SIZE = 500;
const FORCE_SEED = process.env.SEED_FORCE === "true";

faker.seed(42);

function pickHobbyIds(hobbyIds: number[]): number[] {
  const count = faker.number.int({ min: 0, max: 10 });
  if (count === 0) {
    return [];
  }

  const shuffled = faker.helpers.shuffle([...hobbyIds]);
  return shuffled.slice(0, count);
}

async function getUserCount(client: PoolClient): Promise<number> {
  const result = await client.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM users",
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function insertHobbies(client: PoolClient): Promise<number[]> {
  const result = await client.query<{ id: number }>(
    `INSERT INTO hobbies (name)
     SELECT UNNEST($1::text[])
     RETURNING id`,
    [HOBBIES],
  );

  return result.rows.map((row) => row.id);
}

async function insertUserBatch(
  client: PoolClient,
  hobbyIds: number[],
  batchSize: number,
): Promise<void> {
  const avatars: string[] = [];
  const firstNames: string[] = [];
  const lastNames: string[] = [];
  const professions: string[] = [];
  const ages: number[] = [];
  const nationalities: string[] = [];

  for (let index = 0; index < batchSize; index += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    avatars.push(`https://i.pravatar.cc/150?u=${faker.string.uuid()}`);
    firstNames.push(firstName);
    lastNames.push(lastName);
    professions.push(faker.helpers.arrayElement(PROFESSIONS));
    ages.push(faker.number.int({ min: 18, max: 80 }));
    nationalities.push(faker.helpers.arrayElement(NATIONALITIES));
  }

  const usersResult = await client.query<{ id: number }>(
    `INSERT INTO users (avatar, first_name, last_name, profession, age, nationality)
     SELECT *
     FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[])
     RETURNING id`,
    [avatars, firstNames, lastNames, professions, ages, nationalities],
  );

  const userIds = usersResult.rows.map((row) => row.id);
  const linkUserIds: number[] = [];
  const linkHobbyIds: number[] = [];

  for (const userId of userIds) {
    for (const hobbyId of pickHobbyIds(hobbyIds)) {
      linkUserIds.push(userId);
      linkHobbyIds.push(hobbyId);
    }
  }

  if (linkUserIds.length > 0) {
    await client.query(
      `INSERT INTO user_hobbies (user_id, hobby_id)
       SELECT *
       FROM UNNEST($1::int[], $2::int[])`,
      [linkUserIds, linkHobbyIds],
    );
  }
}

async function seed() {
  const client = await pool.connect();

  try {
    const existingUsers = await getUserCount(client);
    if (existingUsers > 0 && !FORCE_SEED) {
      console.log(
        `Database already has ${existingUsers} users. Set SEED_FORCE=true to reseed.`,
      );
      return;
    }

    await client.query("BEGIN");
    await client.query(
      "TRUNCATE TABLE user_hobbies, users, hobbies RESTART IDENTITY CASCADE",
    );

    const hobbyIds = await insertHobbies(client);
    const batches = Math.ceil(USER_COUNT / BATCH_SIZE);

    for (let batch = 0; batch < batches; batch += 1) {
      const remaining = USER_COUNT - batch * BATCH_SIZE;
      const batchSize = Math.min(BATCH_SIZE, remaining);
      await insertUserBatch(client, hobbyIds, batchSize);
      console.log(
        `Inserted users ${batch * BATCH_SIZE + 1}-${batch * BATCH_SIZE + batchSize} of ${USER_COUNT}`,
      );
    }

    await client.query("COMMIT");

    const summary = await client.query<{
      users: string;
      hobbies: string;
      links: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::text FROM users) AS users,
        (SELECT COUNT(*)::text FROM hobbies) AS hobbies,
        (SELECT COUNT(*)::text FROM user_hobbies) AS links
    `);

    const { users, hobbies, links } = summary.rows[0]!;
    console.log(`Seed complete: ${users} users, ${hobbies} hobbies, ${links} user-hobby links.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
