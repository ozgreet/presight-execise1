import type { FacetItem } from "./user.js";

export type AgeBucketStat = {
  label: string;
  min: number;
  max: number | null;
  count: number;
};

export type InsightsOverview = {
  totalPeople: number;
  nationalityCount: number;
  hobbyCount: number;
  medianAge: number | null;
  filtered: boolean;
  topNationalities: FacetItem[];
  topHobbies: FacetItem[];
  ageDistribution: AgeBucketStat[];
};
