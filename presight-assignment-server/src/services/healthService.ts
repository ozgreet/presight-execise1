import { checkDatabaseConnection } from "../db/index.js";

export const healthService = {
  getStatus() {
    return { status: "success" as const };
  },

  async getReadiness() {
    await checkDatabaseConnection();
    return { status: "ready" as const };
  },
};
