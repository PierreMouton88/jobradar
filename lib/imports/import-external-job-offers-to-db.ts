import { prisma } from "@/lib/prisma";
import type { CandidateProfile } from "@/lib/profile/candidate-profile";
import type { ExternalJobOffer } from "@/types/external-job-offer";
import {
  prepareExternalOfferForDb,
  previewExternalJobOffersImport,
} from "../offers/import-external-job-offers";
import {
  filterExternalOffersByRelevance,
  type ExternalOfferRelevanceReasonCount,
} from "./external-offer-relevance-filter";

export type ImportExternalJobOffersRelevanceFilterOptions = {
  enabled: boolean;
  minScore?: number;
  profile: CandidateProfile;
  searchLocations?: string[];
};

export type ImportExternalJobOffersToDbOptions = {
  externalOffers: ExternalJobOffer[];
  sourceLabel: string;
  dryRun?: boolean;
  relevanceFilter?: ImportExternalJobOffersRelevanceFilterOptions;
};

export type ImportedExternalJobOfferEventAction =
  | "CREATED"
  | "UPDATED"
  | "REJECTED_BY_RELEVANCE"
  | "PREVIEW_ERROR"
  | "IMPORT_ERROR";

export type ImportedExternalJobOfferEvent = {
  action: ImportedExternalJobOfferEventAction;
  jobOfferId: string | null;

  source: string;
  externalId: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  url: string | null;

  relevanceScore: number | null;
  relevanceReasons: string[];

  errorMessage: string | null;
};

export type ImportExternalJobOffersToDbReport = {
  totalExternalOffers: number;
  preparedOffers: number;
  uniqueOffers: number;
  duplicatesSkipped: number;
  previewErrors: number;

  relevanceFilterEnabled: boolean;
  relevanceFilterMinScore: number | null;
  acceptedByRelevance: number;
  rejectedByRelevance: number;
  relevanceRejectionReasonCounts: ExternalOfferRelevanceReasonCount[];

  created: number;
  updated: number;
  errors: string[];
  scrapingRunId: string | null;
  dryRun: boolean;

  offerEvents: ImportedExternalJobOfferEvent[];
};

function getStringField(value: unknown, fieldName: string): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const fieldValue = (value as Record<string, unknown>)[fieldName];

  if (typeof fieldValue !== "string") {
    return null;
  }

  const trimmedValue = fieldValue.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function formatPreviewError(error: {
  index: number;
  externalId?: string | null;
  message: string;
}): string {
  return `Preview error at index ${error.index}${
    error.externalId ? ` (${error.externalId})` : ""
  }: ${error.message}`;
}

export async function importExternalJobOffersToDb(
  options: ImportExternalJobOffersToDbOptions,
): Promise<ImportExternalJobOffersToDbReport> {
  const dryRun = options.dryRun ?? false;

  const preview = previewExternalJobOffersImport(options.externalOffers);

  const relevanceFilter = options.relevanceFilter;
  const relevanceFilterEnabled = relevanceFilter?.enabled ?? false;

  const relevanceFilterResult =
    relevanceFilterEnabled && relevanceFilter
      ? filterExternalOffersByRelevance({
          offers: preview.uniqueOffers,
          profile: relevanceFilter.profile,
          minScore: relevanceFilter.minScore,
          searchLocations: relevanceFilter.searchLocations,
        })
      : null;
  const offersToImport =
    relevanceFilterResult?.acceptedOffers ?? preview.uniqueOffers;

  const previewErrorMessages = preview.errors.map(formatPreviewError);

  const report: ImportExternalJobOffersToDbReport = {
    totalExternalOffers: preview.totalOffers,
    preparedOffers: preview.preparedOffers.length,
    uniqueOffers: preview.uniqueOffers.length,
    duplicatesSkipped: preview.duplicates.length,
    previewErrors: preview.errors.length,

    relevanceFilterEnabled,
    relevanceFilterMinScore: relevanceFilterResult?.minScore ?? null,
    acceptedByRelevance: offersToImport.length,
    rejectedByRelevance: relevanceFilterResult?.rejectedOffers.length ?? 0,
    relevanceRejectionReasonCounts: relevanceFilterResult?.reasonCounts ?? [],

    created: 0,
    updated: 0,
    errors: previewErrorMessages,
    scrapingRunId: null,
    dryRun,

    offerEvents: [],
  };

  report.offerEvents.push(
    ...preview.errors.map((error) => ({
      action: "PREVIEW_ERROR" as const,
      jobOfferId: null,

      source: options.sourceLabel,
      externalId: error.externalId ?? null,
      title: null,
      company: null,
      location: null,
      url: null,

      relevanceScore: null,
      relevanceReasons: [],

      errorMessage: formatPreviewError(error),
    })),
  );

  if (relevanceFilterResult) {
    report.offerEvents.push(
      ...relevanceFilterResult.rejectedOffers.map((rejectedOffer) => ({
        action: "REJECTED_BY_RELEVANCE" as const,
        jobOfferId: null,

        source:
          getStringField(rejectedOffer.offer, "sourceName") ??
          options.sourceLabel,
        externalId: getStringField(rejectedOffer.offer, "externalId"),
        title: rejectedOffer.offer.title,
        company: rejectedOffer.offer.company,
        location: rejectedOffer.offer.location,
        url:
          getStringField(rejectedOffer.offer, "sourceUrl") ??
          getStringField(rejectedOffer.offer, "url"),

        relevanceScore: rejectedOffer.score,
        relevanceReasons: rejectedOffer.reasons,

        errorMessage: null,
      })),
    );
  }

  if (dryRun) {
    return report;
  }

  const scrapingRun = await prisma.scrapingRun.create({
    data: {
      source: options.sourceLabel,
      status: "SUCCESS",
      offersCount: 0,
      startedAt: new Date(),
    },
  });

  report.scrapingRunId = scrapingRun.id;

  for (const offer of offersToImport) {
    try {
      const dbOffer = prepareExternalOfferForDb(offer);

      const existingOffer = await prisma.jobOffer.findUnique({
        where: {
          url: dbOffer.url,
        },
        select: {
          id: true,
        },
      });

      const savedOffer = await prisma.jobOffer.upsert({
        where: {
          url: dbOffer.url,
        },
        create: {
          ...dbOffer,
          scrapingRunId: scrapingRun.id,
        },
        update: {
          ...dbOffer,
          scrapingRunId: scrapingRun.id,
        },
        select: {
          id: true,
        },
      });

      if (existingOffer) {
        report.updated++;
      } else {
        report.created++;
      }

      report.offerEvents.push({
        action: existingOffer ? "UPDATED" : "CREATED",
        jobOfferId: savedOffer.id,

        source: dbOffer.source,
        externalId: getStringField(offer, "externalId"),
        title: dbOffer.title,
        company: dbOffer.company,
        location: dbOffer.location,
        url: dbOffer.url,

        relevanceScore: null,
        relevanceReasons: [],

        errorMessage: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";

      report.errors.push(message);

      report.offerEvents.push({
        action: "IMPORT_ERROR",
        jobOfferId: null,

        source: options.sourceLabel,
        externalId: getStringField(offer, "externalId"),
        title: getStringField(offer, "title"),
        company: getStringField(offer, "company"),
        location: getStringField(offer, "location"),
        url:
          getStringField(offer, "sourceUrl") ?? getStringField(offer, "url"),

        relevanceScore: null,
        relevanceReasons: [],

        errorMessage: message,
      });
    }
  }

  const importedOffersCount = report.created + report.updated;

  const finalStatus =
    report.errors.length === 0
      ? "SUCCESS"
      : importedOffersCount > 0
        ? "PARTIAL"
        : "FAILED";

  await prisma.scrapingRun.update({
    where: {
      id: scrapingRun.id,
    },
    data: {
      status: finalStatus,
      offersCount: importedOffersCount,
      finishedAt: new Date(),
      errorMessage: report.errors.length > 0 ? report.errors.join("\n") : null,
    },
  });

  return report;
}
