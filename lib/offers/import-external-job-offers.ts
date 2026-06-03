import type { ExternalJobOffer } from "../../types/external-job-offer";
import { cleanText, normalizeUrl } from "./offer-cleaning";
import {
  detectRemote,
  detectSkills,
  normalizeContractTypeForDb,
} from "./offer-normalization";
import type { ContractType } from "@prisma/client";
import { analyzeOfferQuality } from "./offer-quality";



export type PreparedExternalJobOffer = {
  externalId: string;
  sourceProvider: string;
  sourceName: string;
  sourceActor: string | null;

  title: string;
  company: string;
  location: string;
  contractType: string;
  normalizedContractType: ReturnType<typeof normalizeContractTypeForDb>;
  description: string;

  sourceUrl: string;
  normalizedSourceUrl: string;
  applyUrl: string | null;

  publishedAt: string | null;
  remoteHint: boolean | null;
  detectedRemote: boolean;

  salaryText: string | null;
  sourceTags: string[];
  rawSkills: string[];
  detectedSkills: string[];
  rawExperienceLevel: string | null;

  rawData: unknown;
};

export type JobOfferCreateInputFromExternal = {
  title: string;
  company: string;
  location: string;
  contractType: ContractType;
  remote: boolean;
  skills: string[];
  description: string;
  source: string;
  url: string;
  scrapedAt: Date | string;
  qualityScore: number;
  qualityIssues: string[];
};


export function prepareExternalOfferForImport(
  externalOffer: ExternalJobOffer,
): PreparedExternalJobOffer {
  const title = cleanText(externalOffer.title);
  const company = cleanText(externalOffer.company);
  const location = cleanText(externalOffer.location);
  const contractType = cleanText(externalOffer.contractType);
  const description = cleanText(externalOffer.description);
  const detectedRemote =
    externalOffer.remoteHint ?? detectRemote(`${title} ${description}`);

  const sourceSkills = externalOffer.rawSkills ?? [];
  const textSkills = detectSkills(`${title} ${description}`);
  const detectedSkills = Array.from(new Set([...sourceSkills, ...textSkills]));
  return {
    externalId: externalOffer.externalId,
    sourceProvider: externalOffer.sourceProvider,
    sourceName: externalOffer.sourceName,
    sourceActor: externalOffer.sourceActor ?? null,

    title,
    company,
    location,
    contractType,
    normalizedContractType: normalizeContractTypeForDb(contractType),
    description,

    sourceUrl: externalOffer.sourceUrl,
    normalizedSourceUrl: normalizeUrl(externalOffer.sourceUrl),
    applyUrl: externalOffer.applyUrl ?? null,

    publishedAt: externalOffer.publishedAt ?? null,
    remoteHint: externalOffer.remoteHint ?? null,
    detectedRemote,

    salaryText: externalOffer.salaryText ?? null,
    sourceTags: externalOffer.sourceTags ?? [],
    rawSkills: externalOffer.rawSkills ?? [],
    detectedSkills,
    rawExperienceLevel: externalOffer.rawExperienceLevel ?? null,

    rawData: externalOffer.rawData,
  };
}
export type ExternalJobOfferImportPreviewError = {
  index: number;
  externalId?: string;
  message: string;
};

export type ExternalJobOfferImportPreviewReport = {
  totalOffers: number;
  preparedOffers: PreparedExternalJobOffer[];
  uniqueOffers: PreparedExternalJobOffer[];
  duplicates: ExternalImportDuplicate[];
  errors: ExternalJobOfferImportPreviewError[];
};

export function previewExternalJobOffersImport(
  externalOffers: ExternalJobOffer[],
): ExternalJobOfferImportPreviewReport {
  const preparedOffers: PreparedExternalJobOffer[] = [];
  const errors: ExternalJobOfferImportPreviewError[] = [];

  externalOffers.forEach((externalOffer, index) => {
    try {
      preparedOffers.push(prepareExternalOfferForImport(externalOffer));
    } catch (error) {
      errors.push({
        index,
        externalId: externalOffer.externalId,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  });
  const deduplicationResult = deduplicatePreparedExternalOffers(preparedOffers);

  return {
    totalOffers: externalOffers.length,
    preparedOffers,
    uniqueOffers: deduplicationResult.uniqueOffers,
    duplicates: deduplicationResult.duplicates,
    errors,
  };
}

export type ExternalImportDuplicate = {
  duplicateIndex: number;
  originalIndex: number;
  reason: "normalized_url" | "business_key";
  externalId: string;
};

export type ExternalImportDeduplicationResult = {
  uniqueOffers: PreparedExternalJobOffer[];
  duplicates: ExternalImportDuplicate[];
};
function normalizeBusinessKeyPart(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildBusinessKey(offer: PreparedExternalJobOffer): string {
  return [
    normalizeBusinessKeyPart(offer.title),
    normalizeBusinessKeyPart(offer.company),
    normalizeBusinessKeyPart(offer.location),
  ].join("|");
}

export function deduplicatePreparedExternalOffers(
  offers: PreparedExternalJobOffer[],
): ExternalImportDeduplicationResult {
  const uniqueOffers: PreparedExternalJobOffer[] = [];
  const duplicates: ExternalImportDuplicate[] = [];

  const seenByUrl = new Map<string, number>();
  const seenByBusinessKey = new Map<string, number>();

  offers.forEach((offer, index) => {
    const urlKey = offer.normalizedSourceUrl;
    const businessKey = buildBusinessKey(offer);

    const duplicateByUrlIndex = seenByUrl.get(urlKey);

    if (duplicateByUrlIndex !== undefined) {
      duplicates.push({
        duplicateIndex: index,
        originalIndex: duplicateByUrlIndex,
        reason: "normalized_url",
        externalId: offer.externalId,
      });

      return;
    }

    const duplicateByBusinessKeyIndex = seenByBusinessKey.get(businessKey);

    if (duplicateByBusinessKeyIndex !== undefined) {
      duplicates.push({
        duplicateIndex: index,
        originalIndex: duplicateByBusinessKeyIndex,
        reason: "business_key",
        externalId: offer.externalId,
      });

      return;
    }

    seenByUrl.set(urlKey, index);
    seenByBusinessKey.set(businessKey, index);
    uniqueOffers.push(offer);
  });

  return {
    uniqueOffers,
    duplicates,
  };
}


function buildExternalSourceLabel(offer: PreparedExternalJobOffer): string {
  return [
    offer.sourceProvider,
    offer.sourceName,
    offer.sourceActor ?? "unknown",
  ].join(":");
}

function parseScrapedAt(value: string | null): Date {
  if (!value) {
    return new Date();
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
}

export function prepareExternalOfferForDb(
  offer: PreparedExternalJobOffer,
): JobOfferCreateInputFromExternal {
  const source = buildExternalSourceLabel(offer);
  const scrapedAt = parseScrapedAt(offer.publishedAt);

  const qualityReport = analyzeOfferQuality(
    {
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType: offer.normalizedContractType,
      description: offer.description,
      source,
      url: offer.normalizedSourceUrl,
      scrapedAt: scrapedAt.toISOString(),
    },
    offer.detectedSkills
  );

  return {
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: offer.normalizedContractType,
    remote: offer.detectedRemote,
    skills: offer.detectedSkills,
    description: offer.description,
    source,
    url: offer.normalizedSourceUrl,
    scrapedAt,
    qualityScore: qualityReport.score,
    qualityIssues: qualityReport.issues,
  };
}