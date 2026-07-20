export type ImportCampaignOfferWithCompatibilityScore = {
  compatibilityScore: number | null;
};

export function sortImportCampaignOffersByCompatibilityScore<
  T extends ImportCampaignOfferWithCompatibilityScore,
>(offers: T[]): T[] {
  return [...offers].sort((offerA, offerB) => {
    const scoreA = offerA.compatibilityScore ?? -1;
    const scoreB = offerB.compatibilityScore ?? -1;

    return scoreB - scoreA;
  });
}