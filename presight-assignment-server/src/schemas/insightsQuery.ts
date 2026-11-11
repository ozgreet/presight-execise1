import { z } from "zod";
import { createFilterQuerySchema } from "../pagination/index.js";

export const insightsQuerySchema = createFilterQuerySchema();

export type InsightsQueryInput = z.infer<typeof insightsQuerySchema>;
