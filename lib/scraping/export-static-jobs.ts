import fs from "node:fs/promises";
import path from "node:path";

import {
  parseStaticJobOffers,
  type ScrapedJobOffer,
} from "./static-job-parser";
import { fakeJobsHtml } from "./static-job-parser.test-data";

type ExportedScrapedJobOffer = ScrapedJobOffer & {
  source: string;
  scrapedAt: string;
};

async function main() {
  const scrapedAt = new Date().toISOString();

  const offers = parseStaticJobOffers(
    fakeJobsHtml,
    "https://jobradar.local"
  );

  const exportedOffers: ExportedScrapedJobOffer[] = offers.map((offer) => ({
    ...offer,
    source: "static-html",
    scrapedAt,
  }));

  const outputPath = path.join(
    process.cwd(),
    "data",
    "scraped-jobs.json"
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await fs.writeFile(
    outputPath,
    JSON.stringify(exportedOffers, null, 2),
    "utf-8"
  );

  console.log(`${exportedOffers.length} offres exportées vers ${outputPath}`);
}

main().catch((error) => {
  console.error("Erreur pendant l'export des offres :", error);
  process.exit(1);
});