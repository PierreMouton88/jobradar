import { ImportCampaignOfferAction } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type CampaignRagSyncPlanItem,
  type ExistingCampaignRagDocument,
  buildCampaignRagSyncPlan,
  isRecord,
} from "@/lib/rag/build-campaign-rag-sync-plan";
import { buildJobOfferRagCandidate } from "@/lib/rag/build-job-offer-rag-candidate";
import { selectCampaignRagJobOfferIds } from "@/lib/rag/select-campaign-rag-job-offer-ids";

export type CampaignRagSyncPreview = {
  campaign: {
    id: string;
    status: string;
    dryRun: boolean;
    startedAt: Date;
    finishedAt: Date | null;
  };
  selectedJobOfferIds: string[];
  missingJobOfferIds: string[];
  plan: CampaignRagSyncPlanItem[];
  summary: {
    selectedOffers: number;
    foundOffers: number;
    missingOffers: number;
    create: number;
    update: number;
    upToDate: number;
    requiringEmbedding: number;
  };
};

export async function getCampaignRagSyncPreview(
  campaignId: string,
): Promise<CampaignRagSyncPreview> {
  const campaign = await prisma.importCampaign.findUnique({
    where: {
      id: campaignId,
    },
    select: {
      id: true,
      status: true,
      dryRun: true,
      startedAt: true,
      finishedAt: true,
      offers: {
        where: {
          action: {
            in: [
              ImportCampaignOfferAction.CREATED,
              ImportCampaignOfferAction.UPDATED,
            ],
          },
          jobOfferId: {
            not: null,
          },
        },
        orderBy: [
          {
            createdAt: "asc",
          },
          {
            id: "asc",
          },
        ],
        select: {
          action: true,
          jobOfferId: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error(`Import campaign not found: ${campaignId}`);
  }

  const selectedJobOfferIds = selectCampaignRagJobOfferIds(
    campaign.offers,
  );

  if (selectedJobOfferIds.length === 0) {
    return {
      campaign: {
        id: campaign.id,
        status: campaign.status,
        dryRun: campaign.dryRun,
        startedAt: campaign.startedAt,
        finishedAt: campaign.finishedAt,
      },
      selectedJobOfferIds: [],
      missingJobOfferIds: [],
      plan: [],
      summary: {
        selectedOffers: 0,
        foundOffers: 0,
        missingOffers: 0,
        create: 0,
        update: 0,
        upToDate: 0,
        requiringEmbedding: 0,
      },
    };
  }

  const offers = await prisma.jobOffer.findMany({
    where: {
      id: {
        in: selectedJobOfferIds,
      },
    },
    include: {
      analysis: true,
    },
  });

  const offersById = new Map(
    offers.map((offer) => [offer.id, offer]),
  );

  const missingJobOfferIds = selectedJobOfferIds.filter(
    (jobOfferId) => !offersById.has(jobOfferId),
  );

  const candidates = selectedJobOfferIds.flatMap((jobOfferId) => {
    const offer = offersById.get(jobOfferId);

    if (!offer) {
      return [];
    }

    return [buildJobOfferRagCandidate(offer)];
  });

  const existingDocumentRows =
    await prisma.ragDocumentEmbedding.findMany({
      where: {
        sourceType: "job_offer",
        sourceId: {
          in: candidates.map((candidate) => candidate.sourceId),
        },
      },
      select: {
        sourceId: true,
        title: true,
        content: true,
        metadata: true,
        modelName: true,
      },
    });

  const existingDocuments: ExistingCampaignRagDocument[] =
    existingDocumentRows.map((row) => ({
      ...row,
      metadata: isRecord(row.metadata) ? row.metadata : null,
    }));

  const plan = buildCampaignRagSyncPlan(
    candidates,
    existingDocuments,
  );

  return {
    campaign: {
      id: campaign.id,
      status: campaign.status,
      dryRun: campaign.dryRun,
      startedAt: campaign.startedAt,
      finishedAt: campaign.finishedAt,
    },
    selectedJobOfferIds,
    missingJobOfferIds,
    plan,
    summary: {
      selectedOffers: selectedJobOfferIds.length,
      foundOffers: candidates.length,
      missingOffers: missingJobOfferIds.length,
      create: plan.filter((item) => item.action === "CREATE").length,
      update: plan.filter((item) => item.action === "UPDATE").length,
      upToDate: plan.filter(
        (item) => item.action === "UP_TO_DATE",
      ).length,
      requiringEmbedding: plan.filter(
        (item) => item.requiresEmbedding,
      ).length,
    },
  };
}