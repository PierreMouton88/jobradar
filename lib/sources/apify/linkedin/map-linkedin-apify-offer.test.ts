import { describe, expect, it } from "vitest";

import { mapLinkedinApifyOffer } from "./map-linkedin-apify-offer";
import type { LinkedinApifyOffer } from "@/types/sources/linkedin-apify";

describe("mapLinkedinApifyOffer", () => {
  it("maps a LinkedIn Apify offer to ExternalJobOffer", () => {
    const rawOffer: LinkedinApifyOffer = {
      job_id: "linkedin-123",
      job_title: "Développeur React / Node.js",
      company_name: "Startup Studio",
      location: "Lyon, Auvergne-Rhône-Alpes, France",
      employment_type: "Full-time",
      job_description:
        "Nous recherchons un développeur fullstack pour travailler sur React, Node.js et PostgreSQL.",
      job_description_raw_html:
        "<p>Nous recherchons un développeur fullstack pour travailler sur React, Node.js et PostgreSQL.</p>",
      job_url: "https://example.com/jobs/linkedin-123",
      apply_url: "https://example.com/apply/linkedin-123",
      salary_range: "38 000 € - 45 000 €",
      seniority_level: "Entry level",
      easy_apply: true,
      time_posted: "2026-05-31",
      num_applicants: "23 applicants",
    };

    const result = mapLinkedinApifyOffer(rawOffer, {
      sourceActor: "apify/linkedin-jobs-scraper",
      datasetId: "dataset-linkedin-123",
      importedAt: "2026-06-01T10:00:00.000Z",
    });

    expect(result).toMatchObject({
      externalId: "linkedin-123",
      sourceProvider: "apify",
      sourceName: "linkedin",
      sourceActor: "apify/linkedin-jobs-scraper",
      title: "Développeur React / Node.js",
      company: "Startup Studio",
      location: "Lyon, Auvergne-Rhône-Alpes, France",
      contractType: "Full-time",
      description:
        "Nous recherchons un développeur fullstack pour travailler sur React, Node.js et PostgreSQL.",
      sourceUrl: "https://example.com/jobs/linkedin-123",
      applyUrl: "https://example.com/apply/linkedin-123",
      publishedAt: "2026-05-31",
      remoteHint: null,
      salaryText: "38 000 € - 45 000 €",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      rawSkills: [],
      rawExperienceLevel: "Entry level",
    });

    expect(result.rawData).toEqual(rawOffer);
  });
});