function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? "development",
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  },
  database: {
    url: requireEnv(
      "DATABASE_URL",
      "postgres://presight:presight@localhost:5432/presight",
    ),
    poolMax: Number(process.env.DATABASE_POOL_MAX) || 20,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
  },
  apiDelayMs: Number(process.env.API_DELAY_MS) || 0,
};
