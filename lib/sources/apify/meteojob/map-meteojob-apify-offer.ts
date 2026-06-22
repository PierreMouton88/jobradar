import type {
  ExternalJobOffer,
  ExternalMappingContext,
} from "@/types/external-job-offer";
import type { MeteojobApifyOffer } from "@/types/sources/meteojob-apify";

const METEOJOB_BASE_URL = "https://www.meteojob.com";

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function getMeteojobCompany(rawOffer: MeteojobApifyOffer): string {
  return rawOffer.company?.name ?? "Entreprise non précisée";
}

function getMeteojobLocation(rawOffer: MeteojobApifyOffer): string {
  if (rawOffer.locality) {
    return rawOffer.locality;
  }

  const firstLocation = rawOffer.locations?.[0];

  return (
    firstLocation?.name ??
    firstLocation?.admin1_label ??
    firstLocation?.country_label ??
    "Lieu non précisé"
  );
}

function getMeteojobContractType(rawOffer: MeteojobApifyOffer): string {
  if (rawOffer.contract_types && rawOffer.contract_types.length > 0) {
    return rawOffer.contract_types.join(", ");
  }

  const labelContracts = rawOffer.labels?.contract_type_list
    ?.map((contract) => contract.value)
    .filter(Boolean);

  if (labelContracts && labelContracts.length > 0) {
    return labelContracts.join(", ");
  }

  return "Type de contrat non précisé";
}

function getMeteojobDescription(rawOffer: MeteojobApifyOffer): string {
  return [
    rawOffer.description,
    rawOffer.profile_description,
    rawOffer.company_description,
    rawOffer.benefits ? `Avantages : ${rawOffer.benefits}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .map(stripHtml)
    .join("\n\n");
}

function getMeteojobSourceUrl(rawOffer: MeteojobApifyOffer): string {
  const jobOfferUrl =
    rawOffer.url?.job_offer ?? rawOffer.url?.job_offer_short ?? null;

  if (!jobOfferUrl) {
    return rawOffer.from_url ?? METEOJOB_BASE_URL;
  }

  if (jobOfferUrl.startsWith("http")) {
    return jobOfferUrl;
  }

  return `${METEOJOB_BASE_URL}${jobOfferUrl}`;
}

function getMeteojobRemoteHint(rawOffer: MeteojobApifyOffer): boolean | null {
  const teleworkValue = rawOffer.labels?.telework?.value?.toLowerCase();

  if (!teleworkValue) {
    return null;
  }

  return teleworkValue.includes("télétravail");
}

function getMeteojobSalaryText(rawOffer: MeteojobApifyOffer): string | null {
  return rawOffer.labels?.salary?.value ?? null;
}

function getMeteojobExperienceLevel(
  rawOffer: MeteojobApifyOffer,
): string | null {
  const levels = rawOffer.labels?.experience_level_list
    ?.map((level) => level.value)
    .filter(Boolean);

  return levels && levels.length > 0 ? levels.join(", ") : null;
}

export function mapMeteojobApifyOffer(
  rawOffer: MeteojobApifyOffer,
  context: ExternalMappingContext = {},
): ExternalJobOffer {
  return {
    externalId: rawOffer.id,
    sourceProvider: "apify",
    sourceName: "meteojob",
    sourceActor: context.sourceActor ?? null,

    title: rawOffer.title,
    company: getMeteojobCompany(rawOffer),
    location: getMeteojobLocation(rawOffer),
    contractType: getMeteojobContractType(rawOffer),
    description: getMeteojobDescription(rawOffer),

    sourceUrl: getMeteojobSourceUrl(rawOffer),
    applyUrl: rawOffer.url?.redirect ?? null,

    publishedAt: rawOffer.publication_date ?? null,
    remoteHint: getMeteojobRemoteHint(rawOffer),

    salaryText: getMeteojobSalaryText(rawOffer),
    salaryMin: rawOffer.salary?.from ?? null,
    salaryMax: rawOffer.salary?.to ?? null,
    salaryCurrency: rawOffer.salary?.currency ?? null,

    rawSkills: [],
    sourceTags: [
      ...(rawOffer.job_type ?? []),
      ...(rawOffer.labels?.job_type_list
        ?.map((jobType) => jobType.value)
        .filter((value): value is string => Boolean(value)) ?? []),
    ],
    rawExperienceLevel: getMeteojobExperienceLevel(rawOffer),

    rawData: rawOffer,
  };
}