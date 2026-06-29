import {
  type ApifyActorAdapter,
  type SupportedApifyActorSource,
  getPrimaryLocation,
  getSafeLimit,
} from "@/lib/sources/apify/apify-actor-adapter";
import { buildCompactSearchText } from "@/lib/search/job-search-criteria";

const INDEED_MIN_LIMIT = 1;
const INDEED_DEFAULT_LIMIT = 20;

const LINKEDIN_MIN_LIMIT = 10;
const LINKEDIN_DEFAULT_LIMIT = 25;
const METEOJOB_ACTOR_ID = "stealth_mode/meteojob-jobs-search-scraper";
const METEOJOB_MIN_LIMIT = 1;
const METEOJOB_DEFAULT_LIMIT = 25;

function buildIndeedSearchText(): string {
  return "développeur web";
}
function buildLinkedinSearchText(): string {
  return "développeur web";
}

export const indeedApifyActorAdapter: ApifyActorAdapter = {
  source: "indeed",
  actorId: "MXLpngmVpE8WTESQr",
  displayName: "Indeed Apify Actor",
  minLimit: INDEED_MIN_LIMIT,
  defaultLimit: INDEED_DEFAULT_LIMIT,

  buildInput(criteria, options = {}) {
    const limit = getSafeLimit(options.limit, INDEED_DEFAULT_LIMIT);
    const location = options.location ?? getPrimaryLocation(criteria);
    const query = buildIndeedSearchText();

    return {
      country: "fr",
      enableUniqueJobs: true,
      fromDays: "14",
      includeSimilarJobs: true,
      location,
      maxRows: limit,
      maxRowsPerUrl: limit,
      query,
      radius: "100",
      sort: "date",
    };
  },
};

function buildMeteojobSearchText(): string {
  return "développeur web";
}
function buildMeteojobSearchUrl(query: string, location: string): string {
  const url = new URL("https://www.meteojob.com/jobs");

  url.searchParams.set("what", query);
  url.searchParams.set("where", location);
  url.searchParams.set("sorting", "DATE");

  return url.toString();
}

export const meteojobApifyActorAdapter: ApifyActorAdapter = {
  source: "meteojob",
  actorId: METEOJOB_ACTOR_ID,
  displayName: "Meteojob Apify Actor",
  minLimit: METEOJOB_MIN_LIMIT,
  defaultLimit: METEOJOB_DEFAULT_LIMIT,

  buildInput(criteria, options = {}) {
    const limit = getSafeLimit(
      options.limit,
      METEOJOB_DEFAULT_LIMIT,
      METEOJOB_MIN_LIMIT,
    );

    const location = options.location ?? getPrimaryLocation(criteria);
    const query = buildMeteojobSearchText();

    return {
      ignore_url_failures: true,
      max_items_per_url: limit,
      urls: [buildMeteojobSearchUrl(query, location)],
    };
  },
};

export const linkedinApifyActorAdapter: ApifyActorAdapter = {
  source: "linkedin",
  actorId: "worldunboxer/rapid-linkedin-scraper",
  displayName: "LinkedIn Apify Actor",
  minLimit: LINKEDIN_MIN_LIMIT,
  defaultLimit: LINKEDIN_DEFAULT_LIMIT,

  buildInput(criteria, options = {}) {
    const limit = getSafeLimit(
      options.limit,
      LINKEDIN_DEFAULT_LIMIT,
      LINKEDIN_MIN_LIMIT,
    );

    const location = options.location ?? getPrimaryLocation(criteria);
    const jobTitle = buildLinkedinSearchText();

    return {
      easy_apply: false,
      job_title: jobTitle,
      jobs_entries: limit,
      location,
      start_jobs: limit,
    };
  },
};

export const apifyActorAdapters = {
  indeed: indeedApifyActorAdapter,
  linkedin: linkedinApifyActorAdapter,
  meteojob: meteojobApifyActorAdapter,
} satisfies Record<SupportedApifyActorSource, ApifyActorAdapter>;

export function getApifyActorAdapter(
  source: string,
): ApifyActorAdapter {
  const adapter =
    apifyActorAdapters[source as SupportedApifyActorSource];

  if (!adapter) {
    throw new Error(`Adapter Apify inconnu : ${source}`);
  }

  return adapter;
}

export function listApifyActorAdapters(): ApifyActorAdapter[] {
  return Object.values(apifyActorAdapters);
}