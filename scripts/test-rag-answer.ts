import { prisma } from "@/lib/prisma";
import { answerQuestionAboutOffers } from "@/lib/rag/answer-question-about-offers";

async function main() {
  const question =
    "Quelles offres semblent les plus adaptées pour un développeur React junior qui veut du télétravail ?";

  console.log("Question :");
  console.log(question);

  const result = await answerQuestionAboutOffers(question);

  console.log("\nRéponse RAG :");
  console.log(result.answer);

  console.log("\nSources utilisées :");

  for (const [index, source] of result.sources.entries()) {
    console.log(
      `#${index + 1} — ${source.title} chez ${source.company} — distance ${source.distance}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Erreur pendant la réponse RAG :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });