import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/rag/generate-embedding";

export type RagDocumentSourceType =
  | "job_offer"
  | "candidate_profile"
  | "profile_document";

export type CreateRagDocumentEmbeddingInput = {
  sourceType: RagDocumentSourceType;
  sourceId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown> | null;
};

export async function createRagDocumentEmbedding(
  input: CreateRagDocumentEmbeddingInput,
) {
  if (!input.content.trim()) {
    throw new Error("Cannot create a RAG document embedding for empty content.");
  }

  const embedding = await generateEmbedding(input.content);
  const embeddingSql = `[${embedding.join(",")}]`;

  const metadataSql = input.metadata
    ? Prisma.sql`${JSON.stringify(input.metadata)}::jsonb`
    : Prisma.sql`NULL`;

  await prisma.$executeRaw`
    INSERT INTO "RagDocumentEmbedding" (
      "id",
      "sourceType",
      "sourceId",
      "title",
      "content",
      "metadata",
      "embedding",
      "modelName",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.sourceType},
      ${input.sourceId},
      ${input.title},
      ${input.content},
      ${metadataSql},
      ${embeddingSql}::vector,
      'text-embedding-3-small',
      NOW(),
      NOW()
    )
    ON CONFLICT ("sourceType", "sourceId")
    DO UPDATE SET
      "title" = EXCLUDED."title",
      "content" = EXCLUDED."content",
      "metadata" = EXCLUDED."metadata",
      "embedding" = EXCLUDED."embedding",
      "modelName" = EXCLUDED."modelName",
      "updatedAt" = NOW();
  `;

  return {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    title: input.title,
    embeddingDimensions: embedding.length,
  };
}