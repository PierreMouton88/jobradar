import { describe, expect, it } from "vitest";

import { mapExternalOfferWithConfig } from "../configurable-field-mapper";
import { linkedinApifyFieldMappingConfig } from "./linkedin-apify-field-mapping";

describe("linkedinApifyFieldMappingConfig", () => {
  it("maps a LinkedIn Apify raw item through the configurable mapper", () => {
    const result = mapExternalOfferWithConfig(
      {
        job_id: "linkedin-config-1",
        job_title: "Développeur Fullstack",
        company_name: "Config Corp",
        location: "Paris",
        employment_type: "Full-time",
        job_description: "React, Node.js, PostgreSQL.",
        job_url: "https://example.com/jobs/linkedin-config-1",
        apply_url: "https://example.com/apply/linkedin-config-1",
        salary_range: "40 000 € - 46 000 €",
        seniority_level: "Entry level",
        time_posted: "2026-06-02",
      },
      linkedinApifyFieldMappingConfig,
      {
        sourceActor: "linkedin-config-actor",
      },
    );

    expect(result).toMatchObject({
      externalId: "linkedin-config-1",
      sourceProvider: "apify",
      sourceName: "linkedin",
      sourceActor: "linkedin-config-actor",
      title: "Développeur Fullstack",
      company: "Config Corp",
      location: "Paris",
      contractType: "Full-time",
      description: "React, Node.js, PostgreSQL.",
      sourceUrl: "https://example.com/jobs/linkedin-config-1",
      applyUrl: "https://example.com/apply/linkedin-config-1",
      salaryText: "40 000 € - 46 000 €",
      rawExperienceLevel: "Entry level",
      publishedAt: "2026-06-02",
    });
  });
});