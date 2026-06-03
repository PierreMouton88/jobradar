import { describe, expect, it } from "vitest";

import { mapExternalRawItem } from "./map-external-raw-item";


describe("mapExternalRawItem", () => {
  it("maps a valid Indeed raw item", () => {
    const result = mapExternalRawItem(
      {
        jobKey: "indeed-1",
        title: "Développeur Fullstack",
        companyName: "Tech Corp",
        location: {
          formattedAddressShort: "Nancy",
        },
        jobType: ["CDI"],
        descriptionText: "React, Node.js et TypeScript.",
        jobUrl: "https://example.com/indeed-1",
        applyUrl: "https://example.com/apply/indeed-1",
        datePublished: "2026-06-01",
        isRemote: true,
        salary: {
          salaryText: "35 000 € - 42 000 €",
          salaryMin: 35000,
          salaryMax: 42000,
          salaryCurrency: "EUR",
        },
        attributes: ["React", "Node.js", "TypeScript"],
      },
      0,
      "indeed",
      {
        sourceActor: "MXLpngmVpE8WTESQr",
        importedAt: "2026-06-02T10:00:00.000Z",
      },
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected mapping result to be valid.");
    }

    expect(result.offer).toMatchObject({
      externalId: "indeed-1",
      sourceProvider: "apify",
      sourceName: "indeed",
      sourceActor: "MXLpngmVpE8WTESQr",
      title: "Développeur Fullstack",
      company: "Tech Corp",
      location: "Nancy",
      contractType: "CDI",
      description: "React, Node.js et TypeScript.",
      sourceUrl: "https://example.com/indeed-1",
      applyUrl: "https://example.com/apply/indeed-1",
      publishedAt: "2026-06-01",
      remoteHint: true,
      salaryText: "35 000 € - 42 000 €",
      salaryMin: 35000,
      salaryMax: 42000,
      salaryCurrency: "EUR",
      rawSkills: [],
sourceTags: ["React", "Node.js", "TypeScript"],
    });
  });

  it("maps a valid LinkedIn raw item", () => {
    const result = mapExternalRawItem(
      {
        job_id: "linkedin-1",
        job_title: "Développeur React",
        company_name: "Startup Studio",
        location: "Metz",
        employment_type: "Full-time",
        job_description: "React, PostgreSQL et API REST.",
        job_url: "https://example.com/linkedin-1",
        apply_url: "https://example.com/apply/linkedin-1",
        salary_range: "38 000 € - 45 000 €",
        seniority_level: "Entry level",
        time_posted: "2026-06-01",
      },
      1,
      "linkedin",
      {
        sourceActor: "linkedin-actor-example",
        importedAt: "2026-06-02T10:00:00.000Z",
      },
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected mapping result to be valid.");
    }

    expect(result.offer).toMatchObject({
      externalId: "linkedin-1",
      sourceProvider: "apify",
      sourceName: "linkedin",
      sourceActor: "linkedin-actor-example",
      title: "Développeur React",
      company: "Startup Studio",
      location: "Metz",
      contractType: "Full-time",
      description: "React, PostgreSQL et API REST.",
      sourceUrl: "https://example.com/linkedin-1",
      applyUrl: "https://example.com/apply/linkedin-1",
      publishedAt: "2026-06-01",
      remoteHint: null,
      salaryText: "38 000 € - 45 000 €",
      rawExperienceLevel: "Entry level",
    });
  });

  it("returns a validation error for an invalid Indeed raw item", () => {
    const result = mapExternalRawItem(
      {
        title: "Offre incomplète",
      },
      2,
      "indeed",
      {
        sourceActor: "MXLpngmVpE8WTESQr",
        importedAt: "2026-06-02T10:00:00.000Z",
      },
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected mapping result to be invalid.");
    }

    expect(result.index).toBe(2);
    expect(result.error).toBeDefined();
  });
});