import "server-only";

import type { Prisma } from "@prisma/client";
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
import { mapCandidateProfileToScoringProfile } from "../search-context/map-candidate-profile-to-scoring-profile";
import { getActiveSearchContext } from "../search-context/get-active-search-context";

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

  relevanceFilterEnabled: boolean;
  relevanceFilterMinScore: number | null;
  acceptedByRelevance: number;
  rejectedByRelevance: number;
  relevanceRejectionReasonCounts: Array<{
    reason: string;
    count: number;
  }>;

  created: number;
  updated: number;
  errors: string[];
  scrapingRunId: string | null;
  importCampaignRunId: string | null;
};

export type ApifyImportCampaignReport = {
  campaignId: string | null;
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  plansCount: number;
  totalRawItems: number;
  totalMappedOffers: number;
  totalPreparedOffers: number;
  totalUniqueOffers: number;

  totalAcceptedByRelevance: number;
  totalRejectedByRelevance: number;

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

function getPlanStatus(report: {
  errors: string[];
  created: number;
  updated: number;
}): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (report.errors.length === 0) {
    return "SUCCESS";
  }

  return report.created + report.updated > 0 ? "PARTIAL" : "FAILED";
}

function getCampaignStatus(report: {
  totalErrors: number;
  totalCreated: number;
  totalUpdated: number;
}): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (report.totalErrors === 0) {
    return "SUCCESS";
  }

  return report.totalCreated + report.totalUpdated > 0 ? "PARTIAL" : "FAILED";
}

export async function runApifyImportCampaign(
  options: RunApifyImportCampaignOptions = {},
): Promise<ApifyImportCampaignReport> {
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    throw new Error(
      "APIFY_TOKEN est manquant dans les variables d’environnement.",
    );
  }

  const dryRun = options.dryRun ?? false;
  const maxLocations = options.maxLocations ?? 3;
  const limitPerPlan = options.limitPerPlan;
  const selectedSources = options.sources;
  const startedAt = new Date().toISOString();

  const activeSearchContext = await getActiveSearchContext();

  if (!activeSearchContext) {
    throw new Error("Aucun scénario de recherche actif trouvé.");
  }

  const activeScenario = activeSearchContext.searchScenario;
  const scoringProfile = mapCandidateProfileToScoringProfile(
    activeSearchContext.candidateProfile,
  );

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

  const campaign = await prisma.importCampaign.create({
    data: {
      sourceType: "apify",
      status: "RUNNING",
      dryRun,
      selectedSources: adapters.map((adapter) => adapter.source),
      selectedLocations: criteria.locations,

      searchScenarioId: activeScenario.id,
      searchScenarioName: activeScenario.name,
      candidateProfileId: activeSearchContext.candidateProfile.id,
      candidateName: activeSearchContext.candidateProfile.name,

      startedAt: new Date(startedAt),
    },
  });

  const planReports: ApifyImportCampaignPlanReport[] = [];

  for (const plan of plans) {
    const source = plan.source as SupportedApifyActorSource;
    const sourceLabel = `external:${plan.source}:apify-actor:${plan.location}`;

    const campaignRun = await prisma.importCampaignRun.create({
      data: {
        campaignId: campaign.id,
        source: plan.source,
        actorId: plan.actorId,
        displayName: plan.displayName,
        location: plan.location,
        limit: plan.limit,
        sourceLabel,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

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
        sourceLabel,
        dryRun,
        relevanceFilter: {
          enabled: true,
          minScore: 40,
          profile: scoringProfile,
          searchLocations: criteria.locations,
        },
      });

      const planStatus = getPlanStatus(importReport);

      await prisma.importCampaignRun.update({
        where: {
          id: campaignRun.id,
        },
        data: {
          status: planStatus,
          rawItems: loadResult.items.length,
          mappedOffers: externalOffers.length,
          preparedOffers: importReport.preparedOffers,
          uniqueOffers: importReport.uniqueOffers,
          duplicatesSkipped: importReport.duplicatesSkipped,
          previewErrors: importReport.previewErrors,

          relevanceFilterEnabled: importReport.relevanceFilterEnabled,
          relevanceFilterMinScore: importReport.relevanceFilterMinScore,
          acceptedByRelevance: importReport.acceptedByRelevance,
          rejectedByRelevance: importReport.rejectedByRelevance,
          relevanceRejectionReasonCounts:
            importReport.relevanceRejectionReasonCounts as Prisma.InputJsonValue,

          created: importReport.created,
          updated: importReport.updated,
          errors: importReport.errors.length,
          errorMessage:
            importReport.errors.length > 0
              ? importReport.errors.join("\n")
              : null,

          scrapingRunId: importReport.scrapingRunId,
          finishedAt: new Date(),
        },
      });

      if (importReport.offerEvents.length > 0) {
        await prisma.importCampaignOffer.createMany({
          data: importReport.offerEvents.map((event) => ({
            campaignId: campaign.id,
            campaignRunId: campaignRun.id,
            jobOfferId: event.jobOfferId,

            action: event.action,

            source: event.source,
            externalId: event.externalId,
            title: event.title,
            company: event.company,
            location: event.location,
            url: event.url,

            relevanceScore: event.relevanceScore,
            relevanceReasons: event.relevanceReasons,

            errorMessage: event.errorMessage,
          })),
        });
      }

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

        relevanceFilterEnabled: importReport.relevanceFilterEnabled,
        relevanceFilterMinScore: importReport.relevanceFilterMinScore,
        acceptedByRelevance: importReport.acceptedByRelevance,
        rejectedByRelevance: importReport.rejectedByRelevance,
        relevanceRejectionReasonCounts:
          importReport.relevanceRejectionReasonCounts,

        created: importReport.created,
        updated: importReport.updated,
        errors: importReport.errors,
        scrapingRunId: importReport.scrapingRunId,
        importCampaignRunId: campaignRun.id,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      await prisma.importCampaignRun.update({
        where: {
          id: campaignRun.id,
        },
        data: {
          status: "FAILED",
          errors: 1,
          errorMessage,
          finishedAt: new Date(),
        },
      });

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

        relevanceFilterEnabled: false,
        relevanceFilterMinScore: null,
        acceptedByRelevance: 0,
        rejectedByRelevance: 0,
        relevanceRejectionReasonCounts: [],

        created: 0,
        updated: 0,
        errors: [errorMessage],
        scrapingRunId: null,
        importCampaignRunId: campaignRun.id,
      });
    }
  }

  const finishedAt = new Date().toISOString();

  const campaignReport: ApifyImportCampaignReport = {
    campaignId: campaign.id,
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
    totalErrors: planReports.reduce((sum, plan) => sum + plan.errors.length, 0),
    totalAcceptedByRelevance: planReports.reduce(
      (sum, plan) => sum + plan.acceptedByRelevance,
      0,
    ),
    totalRejectedByRelevance: planReports.reduce(
      (sum, plan) => sum + plan.rejectedByRelevance,
      0,
    ),
    plans: planReports,
  };

  await prisma.importCampaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: getCampaignStatus(campaignReport),
      finishedAt: new Date(finishedAt),

      totalRawItems: campaignReport.totalRawItems,
      totalMappedOffers: campaignReport.totalMappedOffers,
      totalPreparedOffers: campaignReport.totalPreparedOffers,
      totalUniqueOffers: campaignReport.totalUniqueOffers,
      totalAcceptedByRelevance: campaignReport.totalAcceptedByRelevance,
      totalRejectedByRelevance: campaignReport.totalRejectedByRelevance,
      totalCreated: campaignReport.totalCreated,
      totalUpdated: campaignReport.totalUpdated,
      totalDuplicatesSkipped: campaignReport.totalDuplicatesSkipped,
      totalErrors: campaignReport.totalErrors,

      errorMessage:
        campaignReport.totalErrors > 0
          ? campaignReport.plans
              .flatMap((plan) => plan.errors)
              .filter(Boolean)
              .join("\n")
          : null,
    },
  });

  return campaignReport;
}
