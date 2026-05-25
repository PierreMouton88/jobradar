import { prisma } from "@/lib/prisma";
import { createJobOfferEmbedding } from "@/lib/rag/create-job-offer-embedding";

async function main() {
  const offers = await prisma.jobOffer.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (offers.length === 0) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

  console.log(`Génération des embeddings pour ${offers.length} offre(s).`);

  for (const offer of offers) {
    console.log(`\nEmbedding pour : ${offer.title}`);

    const result = await createJobOfferEmbedding(offer.id);

    console.log("OK", result);
  }

  console.log("\nTerminé.");
}

main()
  .catch((error) => {
    console.error("Erreur pendant la génération des embeddings :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });