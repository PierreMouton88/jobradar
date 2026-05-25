import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/rag/generate-embedding";

export type RagSearchResult = {
  jobOfferId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  content: string;
  distance: number;
};

export async function searchJobOffersWithRag(
  query: string,
  limit = 3,
): Promise<RagSearchResult[]> {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty.");
  }

  const queryEmbedding = await generateEmbedding(query);
  const queryEmbeddingSql = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw<RagSearchResult[]>`
    SELECT
      e."jobOfferId",
      o."title",
      o."company",
      o."location",
      o."contractType",
      e."content",
      e."embedding" <=> ${queryEmbeddingSql}::vector AS "distance"
    FROM "JobOfferEmbedding" e
    INNER JOIN "JobOffer" o ON o."id" = e."jobOfferId"
    ORDER BY e."embedding" <=> ${queryEmbeddingSql}::vector
    LIMIT ${limit};
  `;

  return results;
}