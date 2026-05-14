import fs from "node:fs/promises";
import path from "node:path";

import { scrapeDynamicJobs } from "./dynamic-job-scraper";

async function main() {
  const jobs = await scrapeDynamicJobs();

  const exportedJobs = jobs.map((job) => ({
    ...job,
    source: "fake-dynamic-jobs",
    scrapedAt: new Date().toISOString(),
  }));

  const outputPath = path.join(
    process.cwd(),
    "data",
    "dynamic-scraped-jobs.json"
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await fs.writeFile(
    outputPath,
    JSON.stringify(exportedJobs, null, 2),
    "utf-8"
  );

  console.log(`Exported ${exportedJobs.length} dynamic jobs to ${outputPath}`);
}

main();