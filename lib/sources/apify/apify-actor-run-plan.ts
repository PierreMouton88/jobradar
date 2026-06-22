import type { JobSearchCriteria } from "@/lib/search/job-search-criteria";
import {
  type ApifyActorAdapter,
  type ApifyActorInput,
  getSafeLimit,
} from "@/lib/sources/apify/apify-actor-adapter";

export type ApifyActorRunPlanItem = {
  source: string;
  actorId: string;
  displayName: string;
  location: string;
  limit: number;
  input: ApifyActorInput;
};

export type BuildApifyActorRunPlanOptions = {
  locations?: string[];
  limit?: number;
  maxLocations?: number;
};

function shouldSkipLocation(location: string): boolean {
  const normalizedLocation = location.trim().toLowerCase();

  return normalizedLocation.length === 0;
}

function cleanLocations(locations: string[]): string[] {
  return Array.from(
    new Set(
      locations
        .map((location) => location.trim())
        .filter((location) => !shouldSkipLocation(location)),
    ),
  );
}

export function buildApifyActorRunPlan(
  adapter: ApifyActorAdapter,
  criteria: JobSearchCriteria,
  options: BuildApifyActorRunPlanOptions = {},
): ApifyActorRunPlanItem[] {
  const maxLocations = options.maxLocations ?? 3;
  const locations = cleanLocations(
    options.locations && options.locations.length > 0
      ? options.locations
      : criteria.locations,
  ).slice(0, maxLocations);

  const selectedLocations = locations.length > 0 ? locations : ["France"];
  const limit = getSafeLimit(options.limit, adapter.defaultLimit, adapter.minLimit);

  return selectedLocations.map((location) => ({
    source: adapter.source,
    actorId: adapter.actorId,
    displayName: adapter.displayName,
    location,
    limit,
    input: adapter.buildInput(criteria, {
      location,
      limit,
    }),
  }));
}