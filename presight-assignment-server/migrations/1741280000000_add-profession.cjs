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

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.addColumn("users", {
    profession: { type: "text", notNull: false },
  });

  pgm.sql(`
    UPDATE users
    SET profession = (
      ARRAY[${PROFESSIONS.map((profession) => `'${profession.replace(/'/g, "''")}'`).join(", ")}]
    )[1 + floor(random() * ${PROFESSIONS.length})::int]
    WHERE profession IS NULL
  `);

  pgm.alterColumn("users", "profession", {
    notNull: true,
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropColumn("users", "profession");
};
