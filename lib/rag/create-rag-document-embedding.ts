import { generateEmbedding } from "@/lib/rag/generate-embedding";
import { RAG_EMBEDDING_MODEL_NAME } from "@/lib/rag/rag-embedding-config";
import type {
  RagDocumentSourceType,
  RagDocumentWriteInput,
} from "@/lib/rag/rag-document-types";
import { saveRagDocumentEmbedding } from "@/lib/rag/save-rag-document-embedding";

export type { RagDocumentSourceType };

export type CreateRagDocumentEmbeddingInput =
  RagDocumentWriteInput;

export async function createRagDocumentEmbedding(
  input: CreateRagDocumentEmbeddingInput,
) {
  if (!input.content.trim()) {
    throw new Error(
      "Cannot create a RAG document embedding for empty content.",
    );
  }

  const embedding = await generateEmbedding(input.content);

  return saveRagDocumentEmbedding({
    ...input,
    embedding,
    modelName: RAG_EMBEDDING_MODEL_NAME,
  });
}