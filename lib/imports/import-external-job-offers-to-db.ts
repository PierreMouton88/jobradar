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
};

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
    errors: preview.errors.map(
      (error) =>
        `Preview error at index ${error.index}${
          error.externalId ? ` (${error.externalId})` : ""
        }: ${error.message}`,
    ),
    scrapingRunId: null,
    dryRun,
  };

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

      await prisma.jobOffer.upsert({
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
      });

      if (existingOffer) {
        report.updated++;
      } else {
        report.created++;
      }
    } catch (error) {
      report.errors.push(
        error instanceof Error ? error.message : "Erreur inconnue",
      );
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
