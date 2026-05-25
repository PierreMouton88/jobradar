import { prisma } from "@/lib/prisma";
import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";
import { generateEmbedding } from "@/lib/rag/generate-embedding";

async function main() {
  const offer = await prisma.jobOffer.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      analysis: true,
    },
  });

  if (!offer) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

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

  console.log("Document RAG utilisé :");
  console.log(ragDocument);

  const embedding = await generateEmbedding(ragDocument);

  console.log("\nEmbedding généré.");
  console.log("Nombre de dimensions :", embedding.length);
  console.log("Premières valeurs :", embedding.slice(0, 10));
}

main()
  .catch((error) => {
    console.error("Erreur pendant le test embedding :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });