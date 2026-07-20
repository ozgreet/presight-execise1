export const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    avatar TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 0 AND 130),
    nationality TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hobbies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE
  );

  CREATE TABLE IF NOT EXISTS user_hobbies (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hobby_id INTEGER NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, hobby_id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_first_name_id
    ON users(first_name COLLATE NOCASE, id);
  CREATE INDEX IF NOT EXISTS idx_users_last_name_id
    ON users(last_name COLLATE NOCASE, id);
  CREATE INDEX IF NOT EXISTS idx_users_age_id
    ON users(age, id);
  CREATE INDEX IF NOT EXISTS idx_users_nationality_id
    ON users(nationality COLLATE NOCASE, id);
  CREATE INDEX IF NOT EXISTS idx_user_hobbies_hobby_user
    ON user_hobbies(hobby_id, user_id);

  CREATE TRIGGER IF NOT EXISTS trg_user_hobbies_max_10_insert
  BEFORE INSERT ON user_hobbies
  WHEN (
    SELECT COUNT(*)
    FROM user_hobbies
    WHERE user_id = NEW.user_id
  ) >= 10
  BEGIN
    SELECT RAISE(ABORT, 'A user cannot have more than 10 hobbies');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_user_hobbies_max_10_update
  BEFORE UPDATE OF user_id ON user_hobbies
  WHEN NEW.user_id <> OLD.user_id AND (
    SELECT COUNT(*)
    FROM user_hobbies
    WHERE user_id = NEW.user_id
  ) >= 10
  BEGIN
    SELECT RAISE(ABORT, 'A user cannot have more than 10 hobbies');
  END;
`;
