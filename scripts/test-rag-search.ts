import { prisma } from "@/lib/prisma";
import { searchJobOffersWithRag } from "@/lib/rag/search-job-offers";

async function main() {
  const query = "Je cherche une offre React junior avec possibilité de télétravail";

  console.log("Question :");
  console.log(query);

  const results = await searchJobOffersWithRag(query, 3);

  if (results.length === 0) {
    console.log("Aucun résultat trouvé.");
    return;
  }

  console.log("\nRésultats :");

  for (const [index, result] of results.entries()) {
    console.log(`\n#${index + 1} — ${result.title}`);
    console.log(`Entreprise : ${result.company}`);
    console.log(`Lieu : ${result.location}`);
    console.log(`Contrat : ${result.contractType}`);
    console.log(`Distance : ${result.distance}`);
    console.log("Extrait du document :");
    console.log(result.content.slice(0, 500));
  }
}

main()
  .catch((error) => {
    console.error("Erreur pendant la recherche RAG :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });