"use server";

import { answerQuestionAboutOffers } from "@/lib/rag/answer-question-about-offers";

export async function askOffersRagQuestion(formData: FormData) {
  const question = formData.get("question");

  if (typeof question !== "string" || !question.trim()) {
    return {
      error: "La question est obligatoire.",
      answer: null,
      sources: [],
    };
  }

  try {
    const result = await answerQuestionAboutOffers(question);

    return {
      error: null,
      answer: result.answer,
      sources: result.sources.map((source) => ({
        jobOfferId: source.jobOfferId,
        title: source.title,
        company: source.company,
        location: source.location,
        contractType: source.contractType,
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