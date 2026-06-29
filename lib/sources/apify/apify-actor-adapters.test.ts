import { describe, expect, it } from "vitest";
import { JobSearchCriteria } from "@/lib/search/job-search-criteria";
import {
  getApifyActorAdapter,
  indeedApifyActorAdapter,
  linkedinApifyActorAdapter,
  listApifyActorAdapters,
  meteojobApifyActorAdapter,
} from "./apify-actor-adapters";

const criteria: JobSearchCriteria = {
  targetRoles: ["Développeur fullstack"],
  keywords: ["React", "TypeScript", "Node.js"],
  locations: ["Nancy", "Metz"],
  remotePolicies: ["hybrid"],
  contractTypes: ["CDI"],
  sourceProviders: ["apify"],
  sourceNames: ["indeed", "linkedin"],
};

describe("indeedApifyActorAdapter", () => {
  it("transforme des critères JobRadar en input Indeed Apify", () => {
    const input = indeedApifyActorAdapter.buildInput(criteria);

    expect(input).toEqual({
      country: "fr",
      enableUniqueJobs: true,
      fromDays: "14",
      includeSimilarJobs: true,
      location: "Nancy",
      maxRows: 20,
      maxRowsPerUrl: 20,
      query: "développeur web",
      radius: "100",
      sort: "date",
    });
  });

  it("permet de surcharger la ville et la limite sans dépasser la limite par défaut", () => {
    const input = indeedApifyActorAdapter.buildInput(criteria, {
      location: "Strasbourg",
      limit: 999,
    });

    expect(input.location).toBe("Strasbourg");
    expect(input.maxRows).toBe(20);
    expect(input.maxRowsPerUrl).toBe(20);
  });
});

describe("linkedinApifyActorAdapter", () => {
  it("transforme des critères JobRadar en input LinkedIn Apify", () => {
    const input = linkedinApifyActorAdapter.buildInput(criteria);

    expect(input).toEqual({
      easy_apply: false,
      job_title: "développeur web",
      jobs_entries: 25,
      location: "Nancy",
      start_jobs: 25,
    });
  });

  it("permet de surcharger la ville et la limite sans dépasser la limite par défaut", () => {
    const input = linkedinApifyActorAdapter.buildInput(criteria, {
      location: "Luxembourg",
      limit: 10,
    });

    expect(input.location).toBe("Luxembourg");
    expect(input.jobs_entries).toBe(10);
    expect(input.start_jobs).toBe(10);
  });
});

describe("apifyActorAdapters registry", () => {
  it("retrouve un adapter par source", () => {
    expect(getApifyActorAdapter("indeed")).toBe(indeedApifyActorAdapter);
    expect(getApifyActorAdapter("linkedin")).toBe(linkedinApifyActorAdapter);
    expect(getApifyActorAdapter("meteojob")).toBe(meteojobApifyActorAdapter);
  });

  it("liste les adapters disponibles", () => {
    expect(listApifyActorAdapters()).toHaveLength(3);
  });

  it("échoue explicitement pour une source inconnue", () => {
    expect(() => getApifyActorAdapter("unknown")).toThrow(
      "Adapter Apify inconnu : unknown",
    );
  });
});

it("remonte la limite à 10 si une limite trop basse est demandée", () => {
  const input = linkedinApifyActorAdapter.buildInput(criteria, {
    location: "Grand Est",
    limit: 5,
  });

  expect(input.jobs_entries).toBe(10);
  expect(input.start_jobs).toBe(10);
});

describe("meteojobApifyActorAdapter", () => {
  it("transforme des critères JobRadar en input Meteojob Apify", () => {
    const input = meteojobApifyActorAdapter.buildInput(criteria, {
      location: "Grand Est",
      limit: 25,
    });

    expect(input).toEqual({
      ignore_url_failures: true,
      max_items_per_url: 25,
      urls: [
        "https://www.meteojob.com/jobs?what=d%C3%A9veloppeur+web&where=Grand+Est&sorting=DATE",
      ],
    });
  });
});
