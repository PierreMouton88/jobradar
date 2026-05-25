import { prisma } from "@/lib/prisma";
import { createJobOfferEmbedding } from "@/lib/rag/create-job-offer-embedding";

async function main() {
  const offer = await prisma.jobOffer.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!offer) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

  console.log(`Création de l'embedding pour : ${offer.title}`);

  const result = await createJobOfferEmbedding(offer.id);

  console.log("Embedding stocké avec succès.");
  console.log(result);
}

main()
  .catch((error) => {
    console.error("Erreur pendant la création de l'embedding :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });