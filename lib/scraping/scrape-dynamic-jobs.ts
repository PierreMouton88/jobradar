import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

type ScrapedDynamicJobOffer = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;
  url: string;
};

async function scrapeDynamicJobs(): Promise<ScrapedDynamicJobOffer[]> {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  try {
    await page.goto("http://localhost:3000/fake-dynamic-jobs", {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });

    await page.waitForSelector('[data-testid="jobs-list"]', {
      timeout: 5_000,
    });

    const loadMoreButton = page.getByRole("button", { name: "Voir plus" });

    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
    }

    const jobs = await page.locator(".job-card").evaluateAll((jobCards) => {
      return jobCards.map((jobCard) => {
        const title =
          jobCard.querySelector(".job-title")?.textContent?.trim() ?? "";

        const company =
          jobCard.querySelector(".job-company")?.textContent?.trim() ?? "";

        const location =
          jobCard.querySelector(".job-location")?.textContent?.trim() ?? "";

        const contractType =
          jobCard.querySelector(".job-contract")?.textContent?.trim() ?? "";

        const description =
          jobCard.querySelector(".job-description")?.textContent?.trim() ?? "";

        const url =
          jobCard.querySelector<HTMLAnchorElement>(".job-url")?.href ?? "";

        return {
          title,
          company,
          location,
          contractType,
          description,
          url,
        };
      });
    });

    return jobs;
  } catch (error) {
    const screenshotPath = path.join(
      process.cwd(),
      "debug",
      "dynamic-scraping-error.png"
    );

    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.error("Dynamic scraping failed:", error);
    console.error(`Screenshot saved to: ${screenshotPath}`);

    return [];
  } finally {
    await browser.close();
  }
}

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