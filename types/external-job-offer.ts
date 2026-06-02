export type ExternalJobSourceProvider =
  | "apify"
  | "manual"
  | "local"
  | "api";


export type ExternalMappingContext = {
  sourceActor?: string | null;
  actorRunId?: string | null;
  datasetId?: string | null;
  importedAt?: string;
};

export type ExternalJobOffer = {
  externalId: string;

  sourceProvider: ExternalJobSourceProvider;
  sourceName: string;
  sourceActor?: string | null;

  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;

  sourceUrl: string;
  applyUrl?: string | null;

  publishedAt?: string | null;
  remoteHint?: boolean | null;

  salaryText?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;

  rawSkills?: string[];
  rawExperienceLevel?: string | null;

  rawData: unknown;
};