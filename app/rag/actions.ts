"use server";

import { answerQuestionWithProfileAwareRag } from "@/lib/rag/answer-question-with-profile-aware-rag";

export async function askRagQuestion(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();

  if (!question) {
    return {
      error: "Pose une question pour interroger le RAG.",
      answer: null,
      sources: [],
    };
  }

  try {
    const result = await answerQuestionWithProfileAwareRag(question, {
      topK: 5,
    });

    return {
      error: null,
      answer: result.answer,
      sources: result.sources.map((source) => ({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        title: source.title,
        distance: source.distance,
      })),
    };
  } catch (error) {
    console.error("Erreur RAG :", error);

    return {
      error: "Une erreur est survenue pendant la réponse RAG.",
      answer: null,
      sources: [],
    };
  }
}