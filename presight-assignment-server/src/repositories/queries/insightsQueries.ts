import { AGE_BUCKETS } from "../../constants/ageBuckets.js";

const ageBucketValues = AGE_BUCKETS.map(
  (bucket) => `('${bucket.label}', ${bucket.min}, ${bucket.max ?? "NULL::int"})`,
).join(",\n    ");

export const insightsQueries = {
  selectOverview: `
    SELECT
      COUNT(*)::int AS total_people,
      COUNT(DISTINCT u.nationality)::int AS nationality_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY u.age)::float AS median_age
    FROM users u
    /*WHERE*/
  `,

  selectDistinctHobbyCount: `
    SELECT COUNT(DISTINCT h.name)::int AS hobby_count
    FROM users u
    JOIN user_hobbies uh ON uh.user_id = u.id
    JOIN hobbies h ON h.id = uh.hobby_id
    /*WHERE*/
  `,

  selectTopNationalities: `
    SELECT u.nationality AS value, COUNT(*)::int AS count
    FROM users u
    /*WHERE*/
    GROUP BY u.nationality
    ORDER BY count DESC, value ASC
    LIMIT 6
  `,

  selectTopHobbies: `
    SELECT h.name AS value, COUNT(DISTINCT u.id)::int AS count
    FROM users u
    JOIN user_hobbies uh ON uh.user_id = u.id
    JOIN hobbies h ON h.id = uh.hobby_id
    /*WHERE*/
    GROUP BY h.name
    ORDER BY count DESC, value ASC
    LIMIT 6
  `,

  selectAgeDistribution: `
    WITH buckets AS (
      SELECT * FROM (VALUES
        ${ageBucketValues}
      ) AS t(label, min_age, max_age)
    ),
    filtered_users AS (
      SELECT u.id, u.age
      FROM users u
      /*WHERE*/
    )
    SELECT
      b.label,
      b.min_age AS min,
      b.max_age AS max,
      COUNT(fu.id)::int AS count
    FROM buckets b
    LEFT JOIN filtered_users fu
      ON fu.age >= b.min_age
      AND (b.max_age IS NULL OR fu.age <= b.max_age)
    GROUP BY b.label, b.min_age, b.max_age
    ORDER BY b.min_age
  `,
} as const;
