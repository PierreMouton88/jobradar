import type { ExternalOfferFieldMappingConfig } from "@/lib/sources/configurable-field-mapper";

export const linkedinApifyFieldMappingConfig: ExternalOfferFieldMappingConfig = {
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
    publishedAt: "time_posted",
  },
};