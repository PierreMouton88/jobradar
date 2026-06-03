import { describe, expect, it } from "vitest";

import {
  deduplicatePreparedExternalOffers,
  PreparedExternalJobOffer,
  prepareExternalOfferForImport,
  previewExternalJobOffersImport,
} from "./import-external-job-offers";
import { ExternalJobOffer } from "@/types/external-job-offer";
import { prepareExternalOfferForDb } from "./import-external-job-offers";

describe("prepareExternalOfferForImport", () => {
  it("prepares an external offer for ingestion", () => {
    const externalOffer: ExternalJobOffer = {
      externalId: "external-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: "MXLpngmVpE8WTESQr",

      title: "  Développeur   Fullstack  ",
      company: "  Tech   Corp ",
      location: "  Nancy   ",
      contractType: " CDI,   Temps plein ",
      description: " React,   Node.js et   PostgreSQL. ",

      sourceUrl:
        "https://example.com/job/external-1?utm_source=test&utm_campaign=demo#details",
      applyUrl: null,

      publishedAt: "2026-06-01",
      remoteHint: true,

      salaryText: "35 000 € - 42 000 €",
      salaryMin: 35000,
      salaryMax: 42000,
      salaryCurrency: "EUR",

      rawSkills: ["React", "Node.js"],

      rawExperienceLevel: "Entry level",

      rawData: {
        id: "raw-1",
      },
    };

    const result = prepareExternalOfferForImport(externalOffer);

    expect(result).toMatchObject({
      externalId: "external-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: "MXLpngmVpE8WTESQr",
      title: "Développeur Fullstack",
      company: "Tech Corp",
      location: "Nancy",
      contractType: "CDI, Temps plein",
      normalizedContractType: "CDI",
      description: "React, Node.js et PostgreSQL.",
      sourceUrl:
        "https://example.com/job/external-1?utm_source=test&utm_campaign=demo#details",
      applyUrl: null,
      publishedAt: "2026-06-01",
      remoteHint: true,
      salaryText: "35 000 € - 42 000 €",
      rawSkills: ["React", "Node.js"],
      rawExperienceLevel: "Entry level",
      rawData: {
        id: "raw-1",
      },
      normalizedSourceUrl: "https://example.com/job/external-1",
    });
  });

  it("detects remote from text when remote hint is missing", () => {
    const externalOffer: ExternalJobOffer = {
      externalId: "external-remote-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: null,

      title: "Développeur React remote",
      company: "Remote Corp",
      location: "France",
      contractType: "CDI",
      description: "Poste ouvert en télétravail complet avec React et Node.js.",

      sourceUrl: "https://example.com/job/remote-1",
      applyUrl: null,

      publishedAt: null,
      remoteHint: null,

      salaryText: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,

      rawSkills: [],
      rawExperienceLevel: null,

      rawData: {},
    };

    const result = prepareExternalOfferForImport(externalOffer);

    expect(result.detectedRemote).toBe(true);
  });

  it("detects skills from title and description", () => {
    const externalOffer: ExternalJobOffer = {
      externalId: "external-skills-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: null,

      title: "Développeur Fullstack TypeScript",
      company: "Skill Corp",
      location: "Nancy",
      contractType: "CDI",
      description: "Stack utilisée : React, Node.js, PostgreSQL et Docker.",

      sourceUrl: "https://example.com/job/skills-1",
      applyUrl: null,

      publishedAt: null,
      remoteHint: null,

      salaryText: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,

      rawSkills: [],
      rawExperienceLevel: null,

      rawData: {},
    };

    const result = prepareExternalOfferForImport(externalOffer);

    expect(result.detectedSkills).toEqual(
      expect.arrayContaining([
        "TypeScript",
        "React",
        "Node.js",
        "PostgreSQL",
        "Docker",
      ]),
    );
  });
  it("previews multiple external offers before import", () => {
    const externalOffers: ExternalJobOffer[] = [
      {
        externalId: "external-preview-1",
        sourceProvider: "apify",
        sourceName: "indeed",
        sourceActor: null,

        title: "Développeur React",
        company: "Preview Corp",
        location: "Nancy",
        contractType: "CDI",
        description: "React, Node.js.",

        sourceUrl: "https://example.com/job/preview-1",
        applyUrl: null,

        publishedAt: null,
        remoteHint: false,

        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,

        rawSkills: [],
        rawExperienceLevel: null,
        rawData: {},
      },
      {
        externalId: "external-preview-2",
        sourceProvider: "apify",
        sourceName: "linkedin",
        sourceActor: null,

        title: "Développeur TypeScript",
        company: "Preview Studio",
        location: "Metz",
        contractType: "Full-time",
        description: "TypeScript, PostgreSQL.",

        sourceUrl: "https://example.com/job/preview-2",
        applyUrl: null,

        publishedAt: null,
        remoteHint: null,

        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,

        rawSkills: [],
        rawExperienceLevel: "Entry level",
        rawData: {},
      },
    ];

    const report = previewExternalJobOffersImport(externalOffers);

    expect(report.totalOffers).toBe(2);
    expect(report.preparedOffers).toHaveLength(2);
    expect(report.errors).toHaveLength(0);
    expect(report.uniqueOffers).toHaveLength(2);
    expect(report.duplicates).toHaveLength(0);

    expect(report.preparedOffers[0]).toMatchObject({
      externalId: "external-preview-1",
      title: "Développeur React",
      normalizedContractType: "CDI",
    });

    expect(report.preparedOffers[1]).toMatchObject({
      externalId: "external-preview-2",
      title: "Développeur TypeScript",
      rawExperienceLevel: "Entry level",
    });
  });

  it("deduplicates prepared offers by normalized source URL", () => {
    const offers: PreparedExternalJobOffer[] = [
      {
        externalId: "offer-1",
        sourceProvider: "apify",
        sourceName: "indeed",
        sourceActor: null,

        title: "Développeur React",
        company: "Tech Corp",
        location: "Paris",
        contractType: "CDI",
        normalizedContractType: "CDI",
        description: "React.",

        sourceUrl: "https://example.com/jobs/1?utm_source=test",
        normalizedSourceUrl: "https://example.com/jobs/1",
        applyUrl: null,

        publishedAt: null,
        remoteHint: null,
        detectedRemote: false,

        salaryText: null,
        sourceTags: [],
        rawSkills: [],
        detectedSkills: ["React"],
        rawExperienceLevel: null,

        rawData: {},
      },
      {
        externalId: "offer-2",
        sourceProvider: "apify",
        sourceName: "indeed",
        sourceActor: null,

        title: "Développeur React",
        company: "Tech Corp",
        location: "Paris",
        contractType: "CDI",
        normalizedContractType: "CDI",
        description: "React.",

        sourceUrl: "https://example.com/jobs/1",
        normalizedSourceUrl: "https://example.com/jobs/1",
        applyUrl: null,

        publishedAt: null,
        remoteHint: null,
        detectedRemote: false,

        salaryText: null,
        sourceTags: [],
        rawSkills: [],
        detectedSkills: ["React"],
        rawExperienceLevel: null,

        rawData: {},
      },
    ];

    const result = deduplicatePreparedExternalOffers(offers);

    expect(result.uniqueOffers).toHaveLength(1);
    expect(result.duplicates).toEqual([
      {
        duplicateIndex: 1,
        originalIndex: 0,
        reason: "normalized_url",
        externalId: "offer-2",
      },
    ]);
  });
  it("includes duplicates in the import preview report", () => {
    const externalOffers: ExternalJobOffer[] = [
      {
        externalId: "external-dup-1",
        sourceProvider: "apify",
        sourceName: "indeed",
        sourceActor: null,

        title: "Développeur React",
        company: "Duplicate Corp",
        location: "Paris",
        contractType: "CDI",
        description: "React.",

        sourceUrl: "https://example.com/job/dup-1?utm_source=test",
        applyUrl: null,

        publishedAt: null,
        remoteHint: false,

        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,

        rawSkills: [],
        sourceTags: [],
        rawExperienceLevel: null,
        rawData: {},
      },
      {
        externalId: "external-dup-2",
        sourceProvider: "apify",
        sourceName: "indeed",
        sourceActor: null,

        title: "Développeur React",
        company: "Duplicate Corp",
        location: "Paris",
        contractType: "CDI",
        description: "React.",

        sourceUrl: "https://example.com/job/dup-1",
        applyUrl: null,

        publishedAt: null,
        remoteHint: false,

        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,

        rawSkills: [],
        sourceTags: [],
        rawExperienceLevel: null,
        rawData: {},
      },
    ];

    const report = previewExternalJobOffersImport(externalOffers);

    expect(report.totalOffers).toBe(2);
    expect(report.preparedOffers).toHaveLength(2);
    expect(report.uniqueOffers).toHaveLength(1);
    expect(report.duplicates).toEqual([
      {
        duplicateIndex: 1,
        originalIndex: 0,
        reason: "normalized_url",
        externalId: "external-dup-2",
      },
    ]);
  });

  it("prepares a prepared external offer for database import", () => {
    const preparedOffer: PreparedExternalJobOffer = {
      externalId: "external-db-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: "MXLpngmVpE8WTESQr",

      title: "Développeur React",
      company: "DB Corp",
      location: "Paris",
      contractType: "CDI",
      normalizedContractType: "CDI",
      description: "React, Node.js et PostgreSQL.",

      sourceUrl: "https://example.com/job/db-1?utm_source=test",
      normalizedSourceUrl: "https://example.com/job/db-1",
      applyUrl: null,

      publishedAt: "2026-06-01",
      remoteHint: null,
      detectedRemote: true,

      salaryText: null,
      sourceTags: [],
      rawSkills: [],
      detectedSkills: ["React", "Node.js", "PostgreSQL"],
      rawExperienceLevel: null,

      rawData: {},
    };

    const result = prepareExternalOfferForDb(preparedOffer);

    expect(result).toMatchObject({
      title: "Développeur React",
      company: "DB Corp",
      location: "Paris",
      contractType: "CDI",
      remote: true,
      skills: ["React", "Node.js", "PostgreSQL"],
      description: "React, Node.js et PostgreSQL.",
      source: "apify:indeed:MXLpngmVpE8WTESQr",
      url: "https://example.com/job/db-1",
      qualityIssues: ["short_description"],
    });

    expect(result.scrapedAt).toBeInstanceOf(Date);
    expect(result.qualityScore).toEqual(expect.any(Number));
  });
});
