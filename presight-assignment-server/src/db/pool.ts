import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.database.ssl,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
