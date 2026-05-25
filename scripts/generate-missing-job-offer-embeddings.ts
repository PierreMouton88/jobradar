import { prisma } from "@/lib/prisma";
import { createJobOfferEmbedding } from "@/lib/rag/create-job-offer-embedding";

const DEFAULT_LIMIT = 5;

function getLimitFromArgs(): number {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));

  if (!limitArg) {
    return DEFAULT_LIMIT;
  }

  const rawValue = limitArg.replace("--limit=", "");
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `Invalid limit "${rawValue}". Use a positive integer, for example --limit=5.`,
    );
  }

  return parsedValue;
}

async function main() {
  const limit = getLimitFromArgs();

  const offersWithoutEmbedding = await prisma.jobOffer.findMany({
    where: {
      embedding: null,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      company: true,
    },
  });

  if (offersWithoutEmbedding.length === 0) {
    console.log("Toutes les offres ont déjà un embedding.");
    return;
  }

  console.log(
    `Génération des embeddings manquants pour ${offersWithoutEmbedding.length} offre(s).`,
  );
  console.log(`Limite utilisée : ${limit}`);

  let successCount = 0;
  let errorCount = 0;

  for (const offer of offersWithoutEmbedding) {
    try {
      console.log(`\nEmbedding pour : ${offer.title} chez ${offer.company}`);

      const result = await createJobOfferEmbedding(offer.id);

      successCount += 1;

      console.log(
        `OK — ${result.embeddingDimensions} dimensions — ${result.title}`,
      );
    } catch (error) {
      errorCount += 1;

      console.error(
        `Erreur pour l'offre "${offer.title}" chez ${offer.company} :`,
        error,
      );
    }
  }

  console.log("\n=== Résumé ===");
  console.log(`Succès : ${successCount}`);
  console.log(`Erreurs : ${errorCount}`);

}
main()
  .catch((error) => {
    console.error("Erreur pendant la génération des embeddings manquants :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });