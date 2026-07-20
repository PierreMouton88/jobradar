import { prisma } from "@/lib/prisma";
import { buildJobOfferRagCandidate } from "@/lib/rag/build-job-offer-rag-candidate";
import { createRagDocumentEmbedding } from "@/lib/rag/create-rag-document-embedding";
import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";

async function main() {
  const offers = await prisma.jobOffer.findMany({
    orderBy: {
      scrapedAt: "desc",
    },
    take: 10,
    include: {
      analysis: true,
    },
  });

  if (offers.length === 0) {
    console.log("Aucune offre trouvée en base.");
    return;
  }

  console.log(
    `Indexation de ${offers.length} offre(s) dans RagDocumentEmbedding...`,
  );

  for (const offer of offers) {
    const content = buildJobOfferRagDocument({
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

    const candidate = buildJobOfferRagCandidate(offer);

    const result = await createRagDocumentEmbedding({
      sourceType: "job_offer",
      sourceId: candidate.sourceId,
      title: candidate.title,
      content: candidate.content,
      metadata: candidate.metadata,
    });

    console.log(
      `OK — ${result.embeddingDimensions} dimensions — ${result.title}`,
    );
  }

  console.log("\nIndexation des offres terminée.");
}

main().catch((error) => {
  console.error(
    "Erreur pendant l’indexation des offres dans RagDocumentEmbedding :",
    error,
  );

  process.exit(1);
});
