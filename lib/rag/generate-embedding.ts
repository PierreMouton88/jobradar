import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL = openai.embeddingModel("text-embedding-3-small");

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