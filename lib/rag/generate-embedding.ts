import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

import { RAG_EMBEDDING_MODEL_NAME } from "@/lib/rag/rag-embedding-config";

const EMBEDDING_MODEL = openai.embeddingModel(RAG_EMBEDDING_MODEL_NAME);

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Cannot generate an embedding for an empty text.");
  }

  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });

  return embedding;
}