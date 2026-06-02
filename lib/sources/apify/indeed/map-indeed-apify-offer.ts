import type {
  ExternalJobOffer,
  ExternalMappingContext,
} from "@/types/external-job-offer";
import type { IndeedApifyOffer } from "@/types/sources/indeed-apify";

function getIndeedLocation(rawOffer: IndeedApifyOffer): string {
  return (
    rawOffer.location?.formattedAddressShort ??
    rawOffer.location?.fullAddress ??
    "Lieu non précisé"
  );
}

function getIndeedContractType(rawOffer: IndeedApifyOffer): string {
  return rawOffer.jobType?.join(", ") ?? "Type de contrat non précisé";
}

export function mapIndeedApifyOffer(
  rawOffer: IndeedApifyOffer,
  context: ExternalMappingContext = {},
): ExternalJobOffer {
  return {
    externalId: rawOffer.jobKey,
    sourceProvider: "apify",
    sourceName: "indeed",
    sourceActor: context.sourceActor ?? null,

    title: rawOffer.title,
    company: rawOffer.companyName,
    location: getIndeedLocation(rawOffer),
    contractType: getIndeedContractType(rawOffer),
    description: rawOffer.descriptionText,

    sourceUrl: rawOffer.jobUrl,
    applyUrl: rawOffer.applyUrl ?? null,

    publishedAt: rawOffer.datePublished ?? null,
    remoteHint: rawOffer.isRemote ?? null,

    salaryText: rawOffer.salary?.salaryText ?? null,
    salaryMin: rawOffer.salary?.salaryMin ?? null,
    salaryMax: rawOffer.salary?.salaryMax ?? null,
    salaryCurrency: rawOffer.salary?.salaryCurrency ?? null,

    rawSkills: rawOffer.attributes ?? [],
    rawExperienceLevel: null,

    rawData: rawOffer,
  };
}