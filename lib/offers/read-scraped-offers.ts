import fs from "node:fs/promises";
import path from "node:path";

import type { ScrapedJobOffer } from "../scraping/static-job-parser";

export type StoredScrapedJobOffer = ScrapedJobOffer & {
  source: string;
  scrapedAt: string;
};

const scrapedJobsFiles = [
  "scraped-jobs.json",
  "dynamic-scraped-jobs.json",
];
function deduplicateOffersByUrl(
  offers: StoredScrapedJobOffer[]
): StoredScrapedJobOffer[] {
  const offersByUrl = new Map<string, StoredScrapedJobOffer>();

  for (const offer of offers) {
    if (!offersByUrl.has(offer.url)) {
      offersByUrl.set(offer.url, offer);
    }
  }

  return Array.from(offersByUrl.values());
}
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

export async function readScrapedOffers(): Promise<StoredScrapedJobOffer[]> {
  const offersByFile = await Promise.all(
    scrapedJobsFiles.map((fileName) => readScrapedJobsFile(fileName))
  );

const allOffers = offersByFile.flat();

return deduplicateOffersByUrl(allOffers);
}