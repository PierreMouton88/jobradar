import { answerQuestionWithProfileAwareRag } from "@/lib/rag/answer-question-with-profile-aware-rag";

async function main() {
  const question =
    "À partir de mon profil et des offres indexées, quelles offres semblent les plus cohérentes avec ma recherche ?";

  console.log("Question :");
  console.log(question);

  const result = await answerQuestionWithProfileAwareRag(question, {
    topK: 5,
  });

  console.log("\nRéponse RAG profil-aware :\n");
  console.log(result.answer);

  console.log("\nSources :");
  for (const source of result.sources) {
    console.log(
      `- ${source.title} (${source.sourceType}, distance ${source.distance})`,
    );
  }
}

main().catch((error) => {
  console.error("Erreur pendant le test de réponse RAG profil-aware :", error);

  process.exit(1);
});