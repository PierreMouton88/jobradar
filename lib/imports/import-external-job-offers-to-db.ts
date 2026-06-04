import { prisma } from "@/lib/prisma";
import type { ExternalJobOffer } from "@/types/external-job-offer";
import {
  prepareExternalOfferForDb,
  previewExternalJobOffersImport,
} from "../offers/import-external-job-offers";

export type ImportExternalJobOffersToDbOptions = {
  externalOffers: ExternalJobOffer[];
  sourceLabel: string;
  dryRun?: boolean;
};

export type ImportExternalJobOffersToDbReport = {
  totalExternalOffers: number;
  preparedOffers: number;
  uniqueOffers: number;
  duplicatesSkipped: number;
  previewErrors: number;
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

  const report: ImportExternalJobOffersToDbReport = {
    totalExternalOffers: preview.totalOffers,
    preparedOffers: preview.preparedOffers.length,
    uniqueOffers: preview.uniqueOffers.length,
    duplicatesSkipped: preview.duplicates.length,
    previewErrors: preview.errors.length,
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

  for (const offer of preview.uniqueOffers) {
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
