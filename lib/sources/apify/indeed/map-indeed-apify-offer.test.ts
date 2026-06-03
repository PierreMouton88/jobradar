import { describe, expect, it } from "vitest";

import { mapIndeedApifyOffer } from "./map-indeed-apify-offer";
import type { IndeedApifyOffer } from "@/types/sources/indeed-apify";

describe("mapIndeedApifyOffer", () => {
  it("maps an Indeed Apify offer to ExternalJobOffer", () => {
    const rawOffer: IndeedApifyOffer = {
      jobKey: "indeed-123",
      title: "Développeur Fullstack TypeScript",
      companyName: "Tech Corp",
      location: {
        formattedAddressShort: "Paris",
        fullAddress: "Paris, Île-de-France, France",
      },
      jobType: ["CDI"],
      descriptionText: "Nous cherchons un développeur React et Node.js.",
      jobUrl: "https://example.com/job/indeed-123",
      applyUrl: "https://example.com/apply/indeed-123",
      datePublished: "2026-05-30",
      isRemote: true,
      salary: {
        salaryText: "35 000 € - 42 000 € par an",
        salaryMin: 35000,
        salaryMax: 42000,
        salaryCurrency: "EUR",
      },
      attributes: ["React", "Node.js", "TypeScript"],
    };

    const result = mapIndeedApifyOffer(rawOffer, {
      sourceActor: "apify/indeed-scraper",
      datasetId: "dataset-123",
      importedAt: "2026-06-01T10:00:00.000Z",
    });

    expect(result).toMatchObject({
      externalId: "indeed-123",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: "apify/indeed-scraper",
      title: "Développeur Fullstack TypeScript",
      company: "Tech Corp",
      location: "Paris",
      contractType: "CDI",
      description: "Nous cherchons un développeur React et Node.js.",
      sourceUrl: "https://example.com/job/indeed-123",
      applyUrl: "https://example.com/apply/indeed-123",
      publishedAt: "2026-05-30",
      remoteHint: true,
      salaryText: "35 000 € - 42 000 € par an",
      salaryMin: 35000,
      salaryMax: 42000,
      salaryCurrency: "EUR",
      rawSkills: [],
sourceTags: ["React", "Node.js", "TypeScript"],
      rawExperienceLevel: null,
    });

    expect(result.rawData).toEqual(rawOffer);
  });
});