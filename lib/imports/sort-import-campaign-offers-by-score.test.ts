import { describe, expect, it } from "vitest";
import { sortImportCampaignOffersByCompatibilityScore } from "./sort-import-campaign-offers-by-score";

describe("sortImportCampaignOffersByCompatibilityScore", () => {
  it("trie les offres du meilleur score au plus faible", () => {
    const offers = [
      { id: "offer-1", compatibilityScore: 54 },
      { id: "offer-2", compatibilityScore: 82 },
      { id: "offer-3", compatibilityScore: 69 },
    ];

    const result =
      sortImportCampaignOffersByCompatibilityScore(offers);

    expect(result.map((offer) => offer.id)).toEqual([
      "offer-2",
      "offer-3",
      "offer-1",
    ]);
  });

  it("place les offres sans score après les offres scorées", () => {
    const offers = [
      { id: "offer-1", compatibilityScore: null },
      { id: "offer-2", compatibilityScore: 42 },
    ];

    const result =
      sortImportCampaignOffersByCompatibilityScore(offers);

    expect(result.map((offer) => offer.id)).toEqual([
      "offer-2",
      "offer-1",
    ]);
  });

  it("ne modifie pas le tableau reçu", () => {
    const offers = [
      { id: "offer-1", compatibilityScore: 20 },
      { id: "offer-2", compatibilityScore: 80 },
    ];

    sortImportCampaignOffersByCompatibilityScore(offers);

    expect(offers.map((offer) => offer.id)).toEqual([
      "offer-1",
      "offer-2",
    ]);
  });
});