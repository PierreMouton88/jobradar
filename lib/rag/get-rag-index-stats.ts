import { prisma } from "@/lib/prisma";

export type RagIndexStats = {
  totalOffers: number;
  indexedOffers: number;
  missingEmbeddings: number;
};

export async function getRagIndexStats(): Promise<RagIndexStats> {
  const [totalOffers, indexedOffers] = await Promise.all([
    prisma.jobOffer.count(),
    prisma.jobOfferEmbedding.count(),
  ]);

  return {
    totalOffers,
    indexedOffers,
    missingEmbeddings: totalOffers - indexedOffers,
  };
}