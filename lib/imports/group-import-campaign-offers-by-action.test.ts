import { describe, expect, it } from "vitest";
import { groupImportCampaignOffersByAction } from "./group-import-campaign-offers-by-action";

describe("groupImportCampaignOffersByAction", () => {
  it("regroupe chaque offre dans la catégorie correspondant à son action", () => {
    const offers = [
      {
        id: "created-1",
        action: "CREATED" as const,
        title: "Développeur React",
      },
      {
        id: "updated-1",
        action: "UPDATED" as const,
        title: "Développeur Node.js",
      },
      {
        id: "rejected-1",
        action: "REJECTED_BY_RELEVANCE" as const,
        title: "Business Developer",
      },
    ];

    const result = groupImportCampaignOffersByAction(offers);

    expect(result.CREATED).toEqual([offers[0]]);
    expect(result.UPDATED).toEqual([offers[1]]);
    expect(result.REJECTED_BY_RELEVANCE).toEqual([offers[2]]);
  });

  it("retourne aussi les catégories qui ne contiennent aucune offre", () => {
    const result = groupImportCampaignOffersByAction([]);

    expect(result).toEqual({
      CREATED: [],
      UPDATED: [],
      REJECTED_BY_RELEVANCE: [],
      PREVIEW_ERROR: [],
      IMPORT_ERROR: [],
    });
  });
});