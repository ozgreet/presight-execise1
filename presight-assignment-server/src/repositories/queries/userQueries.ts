export const userQueries = {
  fromUsers: "users u",

  selectUserColumns:
    "u.id, u.avatar, u.first_name, u.last_name, u.profession, u.age, u.nationality",

  selectHobbiesByUserIds: `
    SELECT uh.user_id, h.name
    FROM user_hobbies uh
    JOIN hobbies h ON h.id = uh.hobby_id
    WHERE uh.user_id = ANY($1::int[])
    ORDER BY h.name ASC
  `,

  selectTopNationalities: `
    SELECT u.nationality AS value, COUNT(*)::int AS count
    FROM users u
    /*WHERE*/
    GROUP BY u.nationality
    ORDER BY count DESC, value ASC
    LIMIT 20
  `,

  selectTopHobbies: `
    SELECT h.name AS value, COUNT(DISTINCT u.id)::int AS count
    FROM users u
    JOIN user_hobbies uh ON uh.user_id = u.id
    JOIN hobbies h ON h.id = uh.hobby_id
    /*WHERE*/
    GROUP BY h.name
    ORDER BY count DESC, value ASC
    LIMIT 20
  `,
} as const;

export function applyWhereClause(sql: string, whereSql: string): string {
  return sql.replace("/*WHERE*/", whereSql);
}
