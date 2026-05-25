import { prisma } from "@/lib/prisma";

async function main() {
  const offers = await prisma.jobOffer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      embedding: true,
    },
  });

  const totalOffers = offers.length;
  const offersWithEmbedding = offers.filter((offer) => offer.embedding).length;
  const offersWithoutEmbedding = totalOffers - offersWithEmbedding;

  console.log("=== État des embeddings RAG ===");
  console.log(`Offres totales : ${totalOffers}`);
  console.log(`Offres avec embedding : ${offersWithEmbedding}`);
  console.log(`Offres sans embedding : ${offersWithoutEmbedding}`);

  if (offersWithoutEmbedding > 0) {
    console.log("\nOffres sans embedding :");

    for (const offer of offers.filter((offer) => !offer.embedding)) {
      console.log(`- ${offer.title} chez ${offer.company}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Erreur pendant la vérification des embeddings :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });