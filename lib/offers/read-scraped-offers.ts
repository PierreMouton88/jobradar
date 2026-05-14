import fs from "node:fs/promises";
import path from "node:path";

import type { ScrapedJobOffer } from "../scraping/static-job-parser";

export type StoredScrapedJobOffer = ScrapedJobOffer & { // On ajoute des métadonnées pour le suivi de l'origine et de la date de scraping */
  source: string;
  scrapedAt: string;
};

export async function readScrapedOffers(): Promise<StoredScrapedJobOffer[]> {
  const filePath = path.join(process.cwd(), "data", "scraped-jobs.json");

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");

    return JSON.parse(fileContent) as StoredScrapedJobOffer[];
  } catch (error) {
    console.warn(
      "Impossible de lire data/scraped-jobs.json. Lance le script d'export avec : npx tsx lib/scraping/export-static-jobs.ts",
      error
    );

    return [];
  }
}