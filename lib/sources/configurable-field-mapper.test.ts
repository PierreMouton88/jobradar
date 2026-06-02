import { describe, expect, it } from "vitest";

import {
  mapExternalOfferWithConfig,
  type ExternalOfferFieldMappingConfig,
} from "./configurable-field-mapper";

describe("mapExternalOfferWithConfig", () => {
  it("maps a flat raw item with a field mapping config", () => {
    const config: ExternalOfferFieldMappingConfig = {
      sourceProvider: "apify",
      sourceName: "linkedin",
      fields: {
        externalId: "job_id",
        title: "job_title",
        company: "company_name",
        location: "location",
        contractType: "employment_type",
        description: "job_description",
        sourceUrl: "job_url",
        applyUrl: "apply_url",
        salaryText: "salary_range",
        rawExperienceLevel: "seniority_level",
      },
    };

    const result = mapExternalOfferWithConfig(
      {
        job_id: "linkedin-123",
        job_title: "Développeur React",
        company_name: "Startup Studio",
        location: "Lyon",
        employment_type: "Full-time",
        job_description: "React, Node.js, PostgreSQL.",
        job_url: "https://example.com/job/linkedin-123",
        apply_url: "https://example.com/apply/linkedin-123",
        salary_range: "38 000 € - 45 000 €",
        seniority_level: "Entry level",
      },
      config,
      {
        sourceActor: "some-linkedin-actor",
        importedAt: "2026-06-02T10:00:00.000Z",
      },
    );

    expect(result).toMatchObject({
      externalId: "linkedin-123",
      sourceProvider: "apify",
      sourceName: "linkedin",
      sourceActor: "some-linkedin-actor",
      title: "Développeur React",
      company: "Startup Studio",
      location: "Lyon",
      contractType: "Full-time",
      description: "React, Node.js, PostgreSQL.",
      sourceUrl: "https://example.com/job/linkedin-123",
      applyUrl: "https://example.com/apply/linkedin-123",
      salaryText: "38 000 € - 45 000 €",
      rawExperienceLevel: "Entry level",
    });

    expect(result.rawData).toEqual({
      job_id: "linkedin-123",
      job_title: "Développeur React",
      company_name: "Startup Studio",
      location: "Lyon",
      employment_type: "Full-time",
      job_description: "React, Node.js, PostgreSQL.",
      job_url: "https://example.com/job/linkedin-123",
      apply_url: "https://example.com/apply/linkedin-123",
      salary_range: "38 000 € - 45 000 €",
      seniority_level: "Entry level",
    });
  });

  it("throws an error when a required mapped field is missing", () => {
    const config: ExternalOfferFieldMappingConfig = {
      sourceProvider: "apify",
      sourceName: "custom",
      fields: {
        externalId: "id",
        title: "title",
        company: "company",
        location: "location",
        contractType: "contract",
        description: "description",
        sourceUrl: "url",
      },
    };

    expect(() =>
      mapExternalOfferWithConfig(
        {
          id: "offer-1",
          title: "Développeur React",
          company: "Tech Corp",
          location: "Paris",
          contract: "CDI",
          // description manquante volontairement
          url: "https://example.com/job/offer-1",
        },
        config,
      ),
    ).toThrow(
      'Champ obligatoire manquant ou invalide pour "description" depuis "description".',
    );
  });

  it("maps nested fields with dot notation", () => {
    const config: ExternalOfferFieldMappingConfig = {
      sourceProvider: "apify",
      sourceName: "custom-nested",
      fields: {
        externalId: "id",
        title: "job.title",
        company: "company.name",
        location: "location.city",
        contractType: "contract.type",
        description: "content.description",
        sourceUrl: "links.source",
        applyUrl: "links.apply",
      },
    };

    const result = mapExternalOfferWithConfig(
      {
        id: "nested-1",
        job: {
          title: "Développeur Fullstack",
        },
        company: {
          name: "Nested Corp",
        },
        location: {
          city: "Paris",
        },
        contract: {
          type: "CDI",
        },
        content: {
          description: "React, Node.js, PostgreSQL.",
        },
        links: {
          source: "https://example.com/jobs/nested-1",
          apply: "https://example.com/apply/nested-1",
        },
      },
      config,
    );

    expect(result).toMatchObject({
      externalId: "nested-1",
      title: "Développeur Fullstack",
      company: "Nested Corp",
      location: "Paris",
      contractType: "CDI",
      description: "React, Node.js, PostgreSQL.",
      sourceUrl: "https://example.com/jobs/nested-1",
      applyUrl: "https://example.com/apply/nested-1",
    });
  });


  it("maps string array fields as comma-separated text", () => {
  const config: ExternalOfferFieldMappingConfig = {
    sourceProvider: "apify",
    sourceName: "custom-array",
    fields: {
      externalId: "id",
      title: "title",
      company: "company",
      location: "location",
      contractType: "jobType",
      description: "description",
      sourceUrl: "url",
    },
  };

  const result = mapExternalOfferWithConfig(
    {
      id: "array-1",
      title: "Développeur TypeScript",
      company: "Array Corp",
      location: "Paris",
      jobType: ["CDI", "Temps plein"],
      description: "React et Node.js.",
      url: "https://example.com/jobs/array-1",
    },
    config,
  );

  expect(result.contractType).toBe("CDI, Temps plein");
});
});
