import type { SearchScenario } from "@prisma/client";
import type { JobSearchCriteria } from "@/lib/search/job-search-criteria";
import { listApifyActorAdapters } from "@/lib/sources/apify/apify-actor-adapters";
import { buildApifyActorRunPlan } from "@/lib/sources/apify/apify-actor-run-plan";

export type ApifyRunPlanViewModel = {
  source: string;
  actorId: string;
  displayName: string;
  location: string;
  limit: number;
  inputJson: string;
  previewCommand: string;
  dryRunImportCommand: string;
};

function mapSearchScenarioToJobSearchCriteria(
  scenario: SearchScenario,
): JobSearchCriteria {
  return {
    targetRoles: scenario.targetRoles,
    locations: scenario.locations,
    keywords: scenario.keywords,
    contractTypes: scenario.contractTypes,
    remotePolicies: scenario.remotePolicies,
    sourceProviders: scenario.sourceProviders,
    sourceNames: scenario.sourceNames,
  };
}

function quoteCliValue(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}

function buildPreviewCommand(source: string, location: string, limit: number): string {
  return [
    "npm run apify:preview-inputs --",
    `--source=${source}`,
    `--location=${quoteCliValue(location)}`,
    `--limit=${limit}`,
  ].join(" ");
}

function buildDryRunImportCommand(
  source: string,
  location: string,
  limit: number,
): string {
  return [
    "npm run external:import --",
    "--input=apify-actor",
    `--source=${source}`,
    "--from-scenario",
    `--location=${quoteCliValue(location)}`,
    `--limit=${limit}`,
    "--dry-run",
    "--run-actor",
  ].join(" ");
}

export function getApifyRunPlansViewModel(
  scenario: SearchScenario | null,
): ApifyRunPlanViewModel[] {
  if (!scenario) {
    return [];
  }

  const criteria = mapSearchScenarioToJobSearchCriteria(scenario);

  return listApifyActorAdapters().flatMap((adapter) => {
    const runPlan = buildApifyActorRunPlan(adapter, criteria, {
      maxLocations: 3,
    });

    return runPlan.map((item) => ({
      source: item.source,
      actorId: item.actorId,
      displayName: item.displayName,
      location: item.location,
      limit: item.limit,
      inputJson: JSON.stringify(item.input, null, 2),
      previewCommand: buildPreviewCommand(
        item.source,
        item.location,
        item.limit,
      ),
      dryRunImportCommand: buildDryRunImportCommand(
        item.source,
        item.location,
        item.limit,
      ),
    }));
  });
}