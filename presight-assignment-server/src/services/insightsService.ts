import { insightsRepository } from "../repositories/insightsRepository.js";
import type { InsightsOverview } from "../types/insights.js";
import type { UserFilters } from "../types/user.js";

export const insightsService = {
  getOverview(filters: UserFilters): Promise<InsightsOverview> {
    return insightsRepository.getOverview(filters);
  },
};
