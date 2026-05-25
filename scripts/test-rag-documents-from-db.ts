import { prisma } from "@/lib/prisma";
import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";

async function main() {
  const offers = await prisma.jobOffer.findMany({
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      analysis: true,
    },
  });

  if (offers.length === 0) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

  for (const offer of offers) {
    const ragDocument = buildJobOfferRagDocument({
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType: offer.contractType,
      remote: offer.remote,
      skills: offer.skills,
      description: offer.description,
      analysis: offer.analysis
        ? {
            summary: offer.analysis.summary,
            requiredSkills: offer.analysis.requiredSkills,
            niceToHaveSkills: offer.analysis.niceToHaveSkills,
            experienceLevel: offer.analysis.experienceLevel,
            remotePolicy: offer.analysis.remotePolicy,
            redFlags: offer.analysis.redFlags,
            positiveSignals: offer.analysis.positiveSignals,
          }
        : null,
    });

    console.log("\n==============================");
    console.log(`DOCUMENT RAG POUR : ${offer.title}`);
    console.log("==============================\n");
    console.log(ragDocument);
  }
}

main()
  .catch((error) => {
    console.error("Erreur pendant le test RAG :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });