import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/rag/generate-embedding";

export type RagDocumentSearchResult = {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  metadata: unknown;
  distance: number;
};

export async function searchRagDocuments(
  query: string,
  options?: {
    topK?: number;
    sourceTypes?: string[];
  },
): Promise<RagDocumentSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new Error("Cannot search RAG documents with an empty query.");
  }

  const topK = options?.topK ?? 5;
  const queryEmbedding = await generateEmbedding(trimmedQuery);
  const queryEmbeddingSql = `[${queryEmbedding.join(",")}]`;

  const sourceTypes = options?.sourceTypes;

  if (sourceTypes && sourceTypes.length > 0) {
    return prisma.$queryRaw<RagDocumentSearchResult[]>`
      SELECT
        "id",
        "sourceType",
        "sourceId",
        "title",
        "content",
        "metadata",
        "embedding" <=> ${queryEmbeddingSql}::vector AS "distance"
      FROM "RagDocumentEmbedding"
      WHERE "sourceType" = ANY(${sourceTypes})
      ORDER BY "embedding" <=> ${queryEmbeddingSql}::vector
      LIMIT ${topK};
    `;
  }

  return prisma.$queryRaw<RagDocumentSearchResult[]>`
    SELECT
      "id",
      "sourceType",
      "sourceId",
      "title",
      "content",
      "metadata",
      "embedding" <=> ${queryEmbeddingSql}::vector AS "distance"
    FROM "RagDocumentEmbedding"
    ORDER BY "embedding" <=> ${queryEmbeddingSql}::vector
    LIMIT ${topK};
  `;
}