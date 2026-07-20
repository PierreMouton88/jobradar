import { ImportCampaignOfferAction } from "@prisma/client";

export type CampaignRagOfferEvent = {
  action: ImportCampaignOfferAction;
  jobOfferId: string | null;
};

const RAG_ELIGIBLE_ACTIONS = new Set<ImportCampaignOfferAction>([
  ImportCampaignOfferAction.CREATED,
  ImportCampaignOfferAction.UPDATED,
]);

export function selectCampaignRagJobOfferIds(
  events: CampaignRagOfferEvent[],
): string[] {
  const selectedJobOfferIds = new Set<string>();

  for (const event of events) {
    if (!RAG_ELIGIBLE_ACTIONS.has(event.action)) {
      continue;
    }

    if (!event.jobOfferId) {
      continue;
    }

    selectedJobOfferIds.add(event.jobOfferId);
  }

  return [...selectedJobOfferIds];
}