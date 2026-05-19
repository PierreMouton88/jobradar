import { prisma } from "@/lib/prisma";
import { analyzeAndSaveJobOffer } from "@/lib/ai/analyze-and-save-job-offer";

async function main() {
  const offer = await prisma.jobOffer.findFirst({
    orderBy: {
      scrapedAt: "desc",
    },
  });

  if (!offer) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

  console.log("Offre sélectionnée :");
  console.log(`${offer.title} — ${offer.company}`);

  const analysis = await analyzeAndSaveJobOffer(offer.id);

  console.log("\nAnalyse sauvegardée :");
  console.log(JSON.stringify(analysis, null, 2));
}

main()
  .catch((error) => {
    console.error("Erreur pendant le test analyse + sauvegarde :");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });