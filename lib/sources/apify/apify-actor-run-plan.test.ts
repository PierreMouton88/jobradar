import { describe, expect, it } from "vitest";
import type { JobSearchCriteria } from "@/lib/search/job-search-criteria";
import { indeedApifyActorAdapter, linkedinApifyActorAdapter } from "./apify-actor-adapters";
import { buildApifyActorRunPlan } from "./apify-actor-run-plan";

const criteria: JobSearchCriteria = {
  targetRoles: ["Développeur Fullstack"],
  keywords: ["React", "TypeScript", "Node.js"],
  locations: ["Grand Est", "Metz", "Nancy", "Strasbourg"],
  remotePolicies: ["hybrid"],
  contractTypes: ["CDI"],
  sourceProviders: ["apify"],
  sourceNames: ["indeed"],
};

describe("buildApifyActorRunPlan", () => {
  it("génère un plan de runs par localisation", () => {
    const runPlan = buildApifyActorRunPlan(
      indeedApifyActorAdapter,
      criteria,
      {
        maxLocations: 2,
      },
    );

    expect(runPlan).toHaveLength(2);

    expect(runPlan[0]).toMatchObject({
      source: "indeed",
      actorId: "MXLpngmVpE8WTESQr",
      displayName: "Indeed Apify Actor",
      location: "Grand Est",
      limit: 20,
    });

    expect(runPlan[0].input.location).toBe("Grand Est");
    expect(runPlan[1].input.location).toBe("Metz");
  });

  it("permet de surcharger les localisations et la limite", () => {
    const runPlan = buildApifyActorRunPlan(
      indeedApifyActorAdapter,
      criteria,
      {
        locations: ["Nancy", "Strasbourg"],
        limit: 5,
      },
    );

    expect(runPlan).toHaveLength(2);
    expect(runPlan[0].location).toBe("Nancy");
    expect(runPlan[0].limit).toBe(5);
    expect(runPlan[0].input.maxRows).toBe(5);
    expect(runPlan[1].location).toBe("Strasbourg");
  });

  it("supprime les localisations vides et dupliquées", () => {
    const runPlan = buildApifyActorRunPlan(
      indeedApifyActorAdapter,
      criteria,
      {
        locations: [" Nancy ", "", "Nancy", "Metz"],
      },
    );

    expect(runPlan.map((item) => item.location)).toEqual([
      "Nancy",
      "Metz",
    ]);
  });

  it("utilise France comme fallback si aucune localisation n'est disponible", () => {
    const runPlan = buildApifyActorRunPlan(
      indeedApifyActorAdapter,
      {
        ...criteria,
        locations: [],
      },
    );

    expect(runPlan).toHaveLength(1);
    expect(runPlan[0].location).toBe("France");
    expect(runPlan[0].input.location).toBe("France");
  });
});

it("respecte la limite minimale propre à l'adapter", () => {
  const runPlan = buildApifyActorRunPlan(
    linkedinApifyActorAdapter,
    criteria,
    {
      locations: ["Grand Est"],
      limit: 5,
    },
  );

  expect(runPlan).toHaveLength(1);
  expect(runPlan[0].limit).toBe(10);
  expect(runPlan[0].input.jobs_entries).toBe(10);
  expect(runPlan[0].input.start_jobs).toBe(10);
});