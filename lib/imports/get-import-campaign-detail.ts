import "server-only";

import { prisma } from "@/lib/prisma";
import { candidateProfile } from "@/lib/profile/candidate-profile";
import { mapDbOfferToScorableOffer } from "@/lib/scoring/map-db-offer-to-scorable-offer";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";

import { groupImportCampaignOffersByAction } from "./group-import-campaign-offers-by-action";
import { sortImportCampaignOffersByCompatibilityScore } from "./sort-import-campaign-offers-by-score";

export async function getImportCampaignDetail(campaignId: string) {
  const campaign = await prisma.importCampaign.findUnique({
    where: {
      id: campaignId,
    },

    select: {
      id: true,
      sourceType: true,
      status: true,
      dryRun: true,

      selectedSources: true,
      selectedLocations: true,

      searchScenarioId: true,
      searchScenarioName: true,
      candidateProfileId: true,
      candidateName: true,

      startedAt: true,
      finishedAt: true,

      totalRawItems: true,
      totalMappedOffers: true,
      totalPreparedOffers: true,
      totalUniqueOffers: true,
      totalAcceptedByRelevance: true,
      totalRejectedByRelevance: true,
      totalCreated: true,
      totalUpdated: true,
      totalDuplicatesSkipped: true,
      totalErrors: true,

      errorMessage: true,

      runs: {
        orderBy: {
          startedAt: "asc",
        },

        select: {
          id: true,

          source: true,
          actorId: true,
          displayName: true,
          location: true,
          limit: true,
          sourceLabel: true,

          status: true,

          rawItems: true,
          mappedOffers: true,
          preparedOffers: true,
          uniqueOffers: true,
          duplicatesSkipped: true,
          previewErrors: true,

          relevanceFilterEnabled: true,
          relevanceFilterMinScore: true,
          acceptedByRelevance: true,
          rejectedByRelevance: true,

          created: true,
          updated: true,
          errors: true,

          errorMessage: true,

          scrapingRunId: true,
          startedAt: true,
          finishedAt: true,
        },
      },

      offers: {
        orderBy: {
          createdAt: "asc",
        },

        select: {
          id: true,
          action: true,

          source: true,
          externalId: true,
          title: true,
          company: true,
          location: true,
          url: true,

          relevanceScore: true,
          relevanceReasons: true,
          errorMessage: true,

          createdAt: true,

          campaignRun: {
            select: {
              id: true,
              source: true,
              displayName: true,
              location: true,
            },
          },

          jobOffer: {
            include: {
              analysis: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const scoredOffers = campaign.offers.map((offer) => {
    if (!offer.jobOffer) {
      return {
        ...offer,
        compatibilityScore: null,
        compatibilityLabel: null,
      };
    }

    const scorableOffer = mapDbOfferToScorableOffer(
      offer.jobOffer,
    );

    const score = scoreJobOffer(
      scorableOffer,
      candidateProfile,
    );

    return {
      ...offer,
      compatibilityScore: score.percentage,
      compatibilityLabel: score.label,
    };
  });

  const groupedOffers =
    groupImportCampaignOffersByAction(scoredOffers);

  return {
    ...campaign,

    offers: scoredOffers,

    offersByAction: {
      ...groupedOffers,

      CREATED: sortImportCampaignOffersByCompatibilityScore(
        groupedOffers.CREATED,
      ),

      UPDATED: sortImportCampaignOffersByCompatibilityScore(
        groupedOffers.UPDATED,
      ),
    },
  };
}

export type ImportCampaignDetail = NonNullable<
  Awaited<ReturnType<typeof getImportCampaignDetail>>
>;

export type ImportCampaignDetailOffer =
  ImportCampaignDetail["offers"][number];

export type ImportCampaignDetailRun =
  ImportCampaignDetail["runs"][number];