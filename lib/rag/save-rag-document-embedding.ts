import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { RagDocumentWriteInput } from "@/lib/rag/rag-document-types";

export type SaveRagDocumentEmbeddingInput =
  RagDocumentWriteInput & {
    embedding: number[];
    modelName: string;
  };

export async function saveRagDocumentEmbedding(
  input: SaveRagDocumentEmbeddingInput,
) {
  if (!input.content.trim()) {
    throw new Error(
      "Cannot save a RAG document embedding for empty content.",
    );
  }

  if (input.embedding.length === 0) {
    throw new Error("Cannot save an empty embedding.");
  }

  const embeddingSql = `[${input.embedding.join(",")}]`;

  const metadataSql =
    input.metadata !== null &&
    input.metadata !== undefined
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
      ${input.modelName},
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
    embeddingDimensions: input.embedding.length,
  };
}