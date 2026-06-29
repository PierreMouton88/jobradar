import type {
  ExternalJobOffer,
  ExternalMappingContext,
} from "@/types/external-job-offer";
import type { IndeedApifyOffer } from "@/types/sources/indeed-apify";

type IndeedApifyOfferWithFallbackFields = IndeedApifyOffer & {
  id?: string | null;
  jobId?: string | null;
  description?: string | null;
  jobDescription?: string | null;
  snippet?: string | null;
  url?: string | null;
  link?: string | null;
  applyLink?: string | null;
};

function safeString(value: string | null | undefined, fallback: string): string {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : fallback;
}

function firstSafeString(
  values: Array<string | null | undefined>,
  fallback: string,
): string {
  for (const value of values) {
    const trimmedValue = value?.trim();

    if (trimmedValue && trimmedValue.length > 0) {
      return trimmedValue;
    }
  }

  return fallback;
}

function getIndeedLocation(rawOffer: IndeedApifyOffer): string {
  return firstSafeString(
    [
      rawOffer.location?.formattedAddressShort,
      rawOffer.location?.fullAddress,
    ],
    "Lieu non précisé",
  );
}

function getIndeedContractType(rawOffer: IndeedApifyOffer): string {
  const jobTypes = rawOffer.jobType
    ?.map((jobType) => jobType?.trim())
    .filter((jobType): jobType is string => Boolean(jobType));

  return jobTypes && jobTypes.length > 0
    ? jobTypes.join(", ")
    : "Type de contrat non précisé";
}

function getIndeedDescription(
  rawOffer: IndeedApifyOfferWithFallbackFields,
): string {
  return firstSafeString(
    [
      rawOffer.descriptionText,
      rawOffer.description,
      rawOffer.jobDescription,
      rawOffer.snippet,
    ],
    "Description non précisée",
  );
}

function getIndeedSourceUrl(
  rawOffer: IndeedApifyOfferWithFallbackFields,
): string {
  return firstSafeString(
    [
      rawOffer.jobUrl,
      rawOffer.applyUrl,
      rawOffer.url,
      rawOffer.link,
      rawOffer.applyLink,
    ],
    "https://fr.indeed.com",
  );
}

function getIndeedApplyUrl(
  rawOffer: IndeedApifyOfferWithFallbackFields,
): string | null {
  const applyUrl = firstSafeString(
    [rawOffer.applyUrl, rawOffer.applyLink],
    "",
  );

  return applyUrl.length > 0 ? applyUrl : null;
}

function getIndeedExternalId(
  rawOffer: IndeedApifyOfferWithFallbackFields,
): string {
  const location = getIndeedLocation(rawOffer);
  const sourceUrl = getIndeedSourceUrl(rawOffer);

  return firstSafeString(
    [
      rawOffer.jobKey,
      rawOffer.jobId,
      rawOffer.id,
      sourceUrl !== "https://fr.indeed.com" ? sourceUrl : null,
    ],
    [
      safeString(rawOffer.title, "offre"),
      safeString(rawOffer.companyName, "entreprise"),
      location,
    ].join(" - "),
  );
}

export function mapIndeedApifyOffer(
  rawOffer: IndeedApifyOfferWithFallbackFields,
  context: ExternalMappingContext = {},
): ExternalJobOffer {
  const sourceUrl = getIndeedSourceUrl(rawOffer);

  return {
    externalId: getIndeedExternalId(rawOffer),
    sourceProvider: "apify",
    sourceName: "indeed",
    sourceActor: context.sourceActor ?? null,

    title: safeString(rawOffer.title, "Titre non précisé"),
    company: safeString(rawOffer.companyName, "Entreprise non précisée"),
    location: getIndeedLocation(rawOffer),
    contractType: getIndeedContractType(rawOffer),
    description: getIndeedDescription(rawOffer),

    sourceUrl,
    applyUrl: getIndeedApplyUrl(rawOffer),

    publishedAt: rawOffer.datePublished ?? null,
    remoteHint: rawOffer.isRemote ?? null,

    salaryText: rawOffer.salary?.salaryText ?? null,
    salaryMin: rawOffer.salary?.salaryMin ?? null,
    salaryMax: rawOffer.salary?.salaryMax ?? null,
    salaryCurrency: rawOffer.salary?.salaryCurrency ?? null,

    rawSkills: [],
    sourceTags: rawOffer.attributes ?? [],
    rawExperienceLevel: null,
    rawData: rawOffer,
  };
}