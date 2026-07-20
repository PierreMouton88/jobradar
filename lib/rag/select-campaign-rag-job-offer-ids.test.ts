import { ImportCampaignOfferAction } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type CampaignRagOfferEvent,
  selectCampaignRagJobOfferIds,
} from "@/lib/rag/select-campaign-rag-job-offer-ids";

function createEvent(
  action: ImportCampaignOfferAction,
  jobOfferId: string | null,
): CampaignRagOfferEvent {
  return {
    action,
    jobOfferId,
  };
}

describe("selectCampaignRagJobOfferIds", () => {
  it("sélectionne uniquement les offres créées ou mises à jour", () => {
    const events: CampaignRagOfferEvent[] = [
      createEvent(ImportCampaignOfferAction.CREATED, "offer-created"),
      createEvent(ImportCampaignOfferAction.UPDATED, "offer-updated"),
      createEvent(
        ImportCampaignOfferAction.REJECTED_BY_RELEVANCE,
        "offer-rejected",
      ),
      createEvent(ImportCampaignOfferAction.PREVIEW_ERROR, "offer-preview-error"),
      createEvent(ImportCampaignOfferAction.IMPORT_ERROR, "offer-import-error"),
    ];

    const result = selectCampaignRagJobOfferIds(events);

    expect(result).toEqual(["offer-created", "offer-updated"]);
  });

  it("ignore les événements éligibles sans jobOfferId", () => {
    const events: CampaignRagOfferEvent[] = [
      createEvent(ImportCampaignOfferAction.CREATED, null),
      createEvent(ImportCampaignOfferAction.UPDATED, "offer-valid"),
      createEvent(ImportCampaignOfferAction.UPDATED, null),
    ];

    const result = selectCampaignRagJobOfferIds(events);

    expect(result).toEqual(["offer-valid"]);
  });

  it("déduplique une offre présente dans plusieurs événements", () => {
    const events: CampaignRagOfferEvent[] = [
      createEvent(ImportCampaignOfferAction.CREATED, "offer-1"),
      createEvent(ImportCampaignOfferAction.UPDATED, "offer-1"),
      createEvent(ImportCampaignOfferAction.CREATED, "offer-1"),
    ];

    const result = selectCampaignRagJobOfferIds(events);

    expect(result).toEqual(["offer-1"]);
  });

  it("préserve l’ordre de première apparition des offres", () => {
    const events: CampaignRagOfferEvent[] = [
      createEvent(ImportCampaignOfferAction.UPDATED, "offer-2"),
      createEvent(ImportCampaignOfferAction.CREATED, "offer-1"),
      createEvent(ImportCampaignOfferAction.UPDATED, "offer-2"),
      createEvent(ImportCampaignOfferAction.CREATED, "offer-3"),
    ];

    const result = selectCampaignRagJobOfferIds(events);

    expect(result).toEqual(["offer-2", "offer-1", "offer-3"]);
  });

  it("retourne une liste vide lorsqu’aucune offre n’est éligible", () => {
    const events: CampaignRagOfferEvent[] = [
      createEvent(
        ImportCampaignOfferAction.REJECTED_BY_RELEVANCE,
        "offer-rejected",
      ),
      createEvent(ImportCampaignOfferAction.PREVIEW_ERROR, null),
      createEvent(ImportCampaignOfferAction.IMPORT_ERROR, null),
    ];

    const result = selectCampaignRagJobOfferIds(events);

    expect(result).toEqual([]);
  });
});