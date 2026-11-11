export type AgeBucketDefinition = {
  label: string;
  min: number;
  max: number | null;
};

export const AGE_BUCKETS: AgeBucketDefinition[] = [
  { label: "18–24", min: 18, max: 24 },
  { label: "25–34", min: 25, max: 34 },
  { label: "35–44", min: 35, max: 44 },
  { label: "45–54", min: 45, max: 54 },
  { label: "55–63", min: 55, max: 63 },
  { label: "64+", min: 64, max: null },
];

export const INSIGHTS_TOP_LIMIT = 6;
