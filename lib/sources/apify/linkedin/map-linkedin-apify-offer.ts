import type {
  ExternalJobOffer,
  ExternalMappingContext,
} from "@/types/external-job-offer";
import type { LinkedinApifyOffer } from "@/types/sources/linkedin-apify";

function getLinkedinLocation(rawOffer: LinkedinApifyOffer): string {
  return rawOffer.location ?? "Lieu non précisé";
}

function getLinkedinContractType(rawOffer: LinkedinApifyOffer): string {
  return rawOffer.employment_type ?? "Type de contrat non précisé";
}

export function mapLinkedinApifyOffer(
  rawOffer: LinkedinApifyOffer,
  context: ExternalMappingContext = {},
): ExternalJobOffer {
  return {
    externalId: rawOffer.job_id,
    sourceProvider: "apify",
    sourceName: "linkedin",
    sourceActor: context.sourceActor ?? null,

    title: rawOffer.job_title,
    company: rawOffer.company_name,
    location: getLinkedinLocation(rawOffer),
    contractType: getLinkedinContractType(rawOffer),
    description: rawOffer.job_description,

    sourceUrl: rawOffer.job_url,
    applyUrl: rawOffer.apply_url ?? null,

    publishedAt: rawOffer.time_posted ?? null,
    remoteHint: null,

    salaryText: rawOffer.salary_range ?? null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,

    rawSkills: [],
    rawExperienceLevel: rawOffer.seniority_level ?? null,

    rawData: rawOffer,
  };
}