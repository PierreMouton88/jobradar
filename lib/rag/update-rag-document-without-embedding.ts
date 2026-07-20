import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { RagDocumentWriteInput } from "@/lib/rag/rag-document-types";

export type UpdateRagDocumentWithoutEmbeddingInput =
  RagDocumentWriteInput & {
    modelName: string;
  };

export async function updateRagDocumentWithoutEmbedding(
  input: UpdateRagDocumentWithoutEmbeddingInput,
) {
  if (!input.content.trim()) {
    throw new Error(
      "Cannot update a RAG document with empty content.",
    );
  }

  const metadataSql =
    input.metadata !== null &&
    input.metadata !== undefined
      ? Prisma.sql`${JSON.stringify(input.metadata)}::jsonb`
      : Prisma.sql`NULL`;

  const updatedRows = await prisma.$executeRaw`
    UPDATE "RagDocumentEmbedding"
    SET
      "title" = ${input.title},
      "content" = ${input.content},
      "metadata" = ${metadataSql},
      "modelName" = ${input.modelName},
      "updatedAt" = NOW()
    WHERE
      "sourceType" = ${input.sourceType}
      AND "sourceId" = ${input.sourceId};
  `;

  if (updatedRows !== 1) {
    throw new Error(
      [
        "RAG document not found during metadata update:",
        `${input.sourceType}/${input.sourceId}`,
      ].join(" "),
    );
  }

  return {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    title: input.title,
  };
}