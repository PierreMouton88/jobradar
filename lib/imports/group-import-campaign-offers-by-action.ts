import type { ImportCampaignOfferAction } from "@prisma/client";

export type ImportCampaignOfferWithAction = {
  action: ImportCampaignOfferAction;
};

export type ImportCampaignOfferGroups<
  T extends ImportCampaignOfferWithAction,
> = Record<ImportCampaignOfferAction, T[]>;

export function groupImportCampaignOffersByAction<
  T extends ImportCampaignOfferWithAction,
>(offers: T[]): ImportCampaignOfferGroups<T> {
  const groups: ImportCampaignOfferGroups<T> = {
    CREATED: [],
    UPDATED: [],
    REJECTED_BY_RELEVANCE: [],
    PREVIEW_ERROR: [],
    IMPORT_ERROR: [],
  };

  for (const offer of offers) {
    groups[offer.action].push(offer);
  }

  return groups;
}