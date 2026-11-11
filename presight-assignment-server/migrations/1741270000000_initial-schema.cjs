/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    avatar: { type: "text", notNull: true },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    age: { type: "integer", notNull: true },
    nationality: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("hobbies", {
    id: "id",
    name: { type: "text", notNull: true, unique: true },
  });

  pgm.createTable("user_hobbies", {
    user_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    hobby_id: {
      type: "integer",
      notNull: true,
      references: "hobbies(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("user_hobbies", "user_hobbies_pkey", {
    primaryKey: ["user_id", "hobby_id"],
  });

  pgm.createIndex("users", "first_name");
  pgm.createIndex("users", "last_name");
  pgm.createIndex("users", "nationality");
  pgm.createIndex("user_hobbies", "hobby_id");
  pgm.createIndex("user_hobbies", "user_id");
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable("user_hobbies");
  pgm.dropTable("hobbies");
  pgm.dropTable("users");
};
