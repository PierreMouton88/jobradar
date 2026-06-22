import type { JobSearchCriteria } from "@/lib/search/job-search-criteria";

export type SupportedApifyActorSource = "indeed" | "linkedin" | "meteojob";

export type ApifyActorInput = Record<string, unknown>;

export type BuildApifyActorInputOptions = {
  location?: string;
  limit?: number;
};

export type ApifyActorAdapter = {
  source: SupportedApifyActorSource;
  actorId: string;
  displayName: string;
  minLimit: number;
  defaultLimit: number;
  buildInput: (
    criteria: JobSearchCriteria,
    options?: BuildApifyActorInputOptions,
  ) => ApifyActorInput;
};

export function getPrimaryLocation(
  criteria: JobSearchCriteria,
  fallback = "France",
): string {
  return criteria.locations[0] ?? fallback;
}

export function getSafeLimit(
  requestedLimit: number | undefined,
  defaultLimit: number,
  minLimit = 1,
): number {
  if (!requestedLimit) {
    return defaultLimit;
  }

  return Math.max(minLimit, Math.min(requestedLimit, defaultLimit));
}