import { searchRagDocuments } from "@/lib/rag/search-rag-documents";
import { readCliQuestion } from "@/lib/cli/read-cli-question";

async function main() {
const query = readCliQuestion({
  fallbackQuestion:
    "Quelles offres semblent compatibles avec mon profil de développeur fullstack JavaScript TypeScript junior ?",
});
  console.log("Question :");
  console.log(query);

  const results = await searchRagDocuments(query, {
    topK: 5,
  });

  console.log("\nRésultats RAG génériques :");

  for (const [index, result] of results.entries()) {
    console.log(`\n#${index + 1}`);
    console.log(`Type : ${result.sourceType}`);
    console.log(`Source ID : ${result.sourceId}`);
    console.log(`Titre : ${result.title}`);
    console.log(`Distance : ${result.distance}`);
    console.log("Extrait :");
    console.log(result.content.slice(0, 500));
  }
}

main().catch((error) => {
  console.error(
    "Erreur pendant le test de recherche RAG générique :",
    error,
  );

  process.exit(1);
});