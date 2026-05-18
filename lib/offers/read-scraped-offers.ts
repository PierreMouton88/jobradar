import fs from "node:fs/promises";
import path from "node:path";
import { cleanScrapedOffer } from "@/lib/offers/offer-cleaning";
import type { ScrapedJobOffer } from "../scraping/static-job-parser";
import { deduplicateOffers, deduplicateOffersWithReport  } from "@/lib/offers/offer-deduplication";


export type StoredScrapedJobOffer = ScrapedJobOffer & {
  source: string;
  scrapedAt: string;
};

export type ReadScrapedOffersReport = {
  rawCount: number;
  cleanedCount: number;
  uniqueCount: number;
  duplicateCount: number;
  duplicatesByReason: Record<string, number>;
  offers: StoredScrapedJobOffer[];
};

function countDuplicatesByReason(
  duplicates: { reason: string }[]
): Record<string, number> {
  return duplicates.reduce<Record<string, number>>((acc, duplicate) => {
    acc[duplicate.reason] = (acc[duplicate.reason] ?? 0) + 1;
    return acc;
  }, {});
}

const scrapedJobsFiles = [
  "scraped-jobs.json",
  "dynamic-scraped-jobs.json",
];

async function readScrapedJobsFile(
  fileName: string
): Promise<StoredScrapedJobOffer[]> {
  const filePath = path.join(process.cwd(), "data", fileName);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");

    return JSON.parse(fileContent) as StoredScrapedJobOffer[];
  } catch (error) {
    console.warn(`Could not read scraped jobs file: ${fileName}`, error);

    return [];
  }
}

export async function readScrapedOffersWithReport(): Promise<ReadScrapedOffersReport> {
  const results = await Promise.all(
    scrapedJobsFiles.map((fileName) => readScrapedJobsFile(fileName))
  );

  const rawOffers = results.flat();
  const cleanedOffers = rawOffers.map((offer) => cleanScrapedOffer(offer));
  const deduplicationReport = deduplicateOffersWithReport(cleanedOffers);

  return {
    rawCount: rawOffers.length,
    cleanedCount: cleanedOffers.length,
    uniqueCount: deduplicationReport.uniqueOffers.length,
    duplicateCount: deduplicationReport.duplicates.length,
    duplicatesByReason: countDuplicatesByReason(
      deduplicationReport.duplicates
    ),
    offers: deduplicationReport.uniqueOffers,
  };
}
export async function readScrapedOffers(): Promise<StoredScrapedJobOffer[]> {
  const report = await readScrapedOffersWithReport();

  return report.offers;
}