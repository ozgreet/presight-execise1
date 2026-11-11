import "dotenv/config";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { checkDatabaseConnection, closePool } from "./db/index.js";
import { registerProcessHandlers } from "./utils/processHandlers.js";

registerProcessHandlers();

async function main() {
  await checkDatabaseConnection();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
