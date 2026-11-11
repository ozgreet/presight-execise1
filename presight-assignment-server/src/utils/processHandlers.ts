export function registerProcessHandlers() {
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception", error);
    process.exit(1);
  });
}
