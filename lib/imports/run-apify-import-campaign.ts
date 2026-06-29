import "server-only";

import { prisma } from "@/lib/prisma";
import type { JobSearchCriteria } from "@/lib/search/job-search-criteria";
import type { SupportedApifyActorSource } from "@/lib/sources/apify/apify-actor-adapter";
import { listApifyActorAdapters } from "@/lib/sources/apify/apify-actor-adapters";
import { buildApifyActorRunPlan } from "@/lib/sources/apify/apify-actor-run-plan";
import { ApifyActorRunExternalRawItemsLoader } from "@/lib/sources/apify/apify-actor-run-external-raw-items-loader";


import type { ExternalJobOffer } from "@/types/external-job-offer";
import type { IndeedApifyOffer } from "@/types/sources/indeed-apify";
import type { LinkedinApifyOffer } from "@/types/sources/linkedin-apify";
import type { MeteojobApifyOffer } from "@/types/sources/meteojob-apify";
import { mapIndeedApifyOffer } from "../sources/apify/indeed/map-indeed-apify-offer";
import { mapLinkedinApifyOffer } from "../sources/apify/linkedin/map-linkedin-apify-offer";
import { mapMeteojobApifyOffer } from "../sources/apify/meteojob/map-meteojob-apify-offer";
import { importExternalJobOffersToDb } from "./import-external-job-offers-to-db";

export type ApifyImportCampaignPlanReport = {
  source: string;
  actorId: string;
  displayName: string;
  location: string;
  limit: number;
  rawItems: number;
  mappedOffers: number;
  preparedOffers: number;
  uniqueOffers: number;
  duplicatesSkipped: number;
  previewErrors: number;
  created: number;
  updated: number;
  errors: string[];
  scrapingRunId: string | null;
};

export type ApifyImportCampaignReport = {
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  plansCount: number;
  totalRawItems: number;
  totalMappedOffers: number;
  totalPreparedOffers: number;
  totalUniqueOffers: number;
  totalCreated: number;
  totalUpdated: number;
  totalDuplicatesSkipped: number;
  totalErrors: number;
  plans: ApifyImportCampaignPlanReport[];
};

export type RunApifyImportCampaignOptions = {
  maxLocations?: number;
  dryRun?: boolean;
  limitPerPlan?: number;
  sources?: SupportedApifyActorSource[];
  locations?: string[];
};

function mapSearchScenarioToJobSearchCriteria(scenario: {
  targetRoles: string[];
  locations: string[];
  keywords: string[];
  contractTypes: string[];
  remotePolicies: string[];
  sourceProviders: string[];
  sourceNames: string[];
}): JobSearchCriteria {
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

function applySelectedLocations(
  criteria: JobSearchCriteria,
  selectedLocations: string[] | undefined,
): JobSearchCriteria {
  const cleanedSelectedLocations =
    selectedLocations
      ?.map((location) => location.trim())
      .filter((location) => location.length > 0) ?? [];

  if (cleanedSelectedLocations.length === 0) {
    return criteria;
  }

  const uniqueLocations = Array.from(new Set(cleanedSelectedLocations));

  return {
    ...criteria,
    locations: uniqueLocations,
  };
}

function mapRawItemsToExternalJobOffers(
  source: SupportedApifyActorSource,
  actorId: string,
  rawItems: unknown[],
): ExternalJobOffer[] {
  switch (source) {
    case "indeed":
      return rawItems.map((rawItem) =>
        mapIndeedApifyOffer(rawItem as IndeedApifyOffer, {
          sourceActor: actorId,
        }),
      );

    case "linkedin":
      return rawItems.map((rawItem) =>
        mapLinkedinApifyOffer(rawItem as LinkedinApifyOffer, {
          sourceActor: actorId,
        }),
      );

    case "meteojob":
      return rawItems.map((rawItem) =>
        mapMeteojobApifyOffer(rawItem as MeteojobApifyOffer, {
          sourceActor: actorId,
        }),
      );

    default: {
      const exhaustiveCheck: never = source;
      throw new Error(`Source Apify non supportée : ${exhaustiveCheck}`);
    }
  }
}

export async function runApifyImportCampaign(
  options: RunApifyImportCampaignOptions = {},
): Promise<ApifyImportCampaignReport> {
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    throw new Error("APIFY_TOKEN est manquant dans les variables d’environnement.");
  }

  const dryRun = options.dryRun ?? false;
  const maxLocations = options.maxLocations ?? 3;
  const limitPerPlan = options.limitPerPlan;
  const selectedSources = options.sources;
  const startedAt = new Date().toISOString();

  const activeScenario = await prisma.searchScenario.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!activeScenario) {
    throw new Error("Aucun scénario de recherche actif trouvé.");
  }

  const baseCriteria = mapSearchScenarioToJobSearchCriteria(activeScenario);
  const criteria = applySelectedLocations(baseCriteria, options.locations);

  if (criteria.locations.length === 0) {
    throw new Error("Aucune localisation valide sélectionnée.");
  }

  const adapters = listApifyActorAdapters().filter((adapter) => {
    if (!selectedSources || selectedSources.length === 0) {
      return true;
    }

    return selectedSources.includes(adapter.source);
  });

  if (adapters.length === 0) {
    throw new Error("Aucune source Apify valide sélectionnée.");
  }

  const plans = adapters.flatMap((adapter) =>
    buildApifyActorRunPlan(adapter, criteria, {
      maxLocations,
      limit: limitPerPlan,
    }),
  );

  const planReports: ApifyImportCampaignPlanReport[] = [];

  for (const plan of plans) {
    const source = plan.source as SupportedApifyActorSource;

    try {
      const loader = new ApifyActorRunExternalRawItemsLoader({
        token,
        actorId: plan.actorId,
        input: plan.input,
        limit: plan.limit,
      });

      const loadResult = await loader.loadItems();

      const externalOffers = mapRawItemsToExternalJobOffers(
        source,
        plan.actorId,
        loadResult.items,
      );

      const importReport = await importExternalJobOffersToDb({
        externalOffers,
        sourceLabel: `external:${plan.source}:apify-actor:${plan.location}`,
        dryRun,
      });

      planReports.push({
        source: plan.source,
        actorId: plan.actorId,
        displayName: plan.displayName,
        location: plan.location,
        limit: plan.limit,
        rawItems: loadResult.items.length,
        mappedOffers: externalOffers.length,
        preparedOffers: importReport.preparedOffers,
        uniqueOffers: importReport.uniqueOffers,
        duplicatesSkipped: importReport.duplicatesSkipped,
        previewErrors: importReport.previewErrors,
        created: importReport.created,
        updated: importReport.updated,
        errors: importReport.errors,
        scrapingRunId: importReport.scrapingRunId,
      });
    } catch (error) {
      planReports.push({
        source: plan.source,
        actorId: plan.actorId,
        displayName: plan.displayName,
        location: plan.location,
        limit: plan.limit,
        rawItems: 0,
        mappedOffers: 0,
        preparedOffers: 0,
        uniqueOffers: 0,
        duplicatesSkipped: 0,
        previewErrors: 0,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"],
        scrapingRunId: null,
      });
    }
  }

  const finishedAt = new Date().toISOString();

  return {
    startedAt,
    finishedAt,
    dryRun,
    plansCount: plans.length,
    totalRawItems: planReports.reduce((sum, plan) => sum + plan.rawItems, 0),
    totalMappedOffers: planReports.reduce(
      (sum, plan) => sum + plan.mappedOffers,
      0,
    ),
    totalPreparedOffers: planReports.reduce(
      (sum, plan) => sum + plan.preparedOffers,
      0,
    ),
    totalUniqueOffers: planReports.reduce(
      (sum, plan) => sum + plan.uniqueOffers,
      0,
    ),
    totalCreated: planReports.reduce((sum, plan) => sum + plan.created, 0),
    totalUpdated: planReports.reduce((sum, plan) => sum + plan.updated, 0),
    totalDuplicatesSkipped: planReports.reduce(
      (sum, plan) => sum + plan.duplicatesSkipped,
      0,
    ),
    totalErrors: planReports.reduce(
      (sum, plan) => sum + plan.errors.length,
      0,
    ),
    plans: planReports,
  };
}