import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";
import { generateEmbedding } from "@/lib/rag/generate-embedding";

export async function createJobOfferEmbedding(jobOfferId: string) {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id: jobOfferId,
    },
    include: {
      analysis: true,
    },
  });

  if (!offer) {
    throw new Error(`Job offer not found: ${jobOfferId}`);
  }

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

  const embedding = await generateEmbedding(content);

  const embeddingSql = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "JobOfferEmbedding" (
      "id",
      "jobOfferId",
      "content",
      "embedding",
      "modelName",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${offer.id},
      ${content},
      ${embeddingSql}::vector,
      'text-embedding-3-small',
      NOW(),
      NOW()
    )
    ON CONFLICT ("jobOfferId")
    DO UPDATE SET
      "content" = EXCLUDED."content",
      "embedding" = EXCLUDED."embedding",
      "modelName" = EXCLUDED."modelName",
      "updatedAt" = NOW();
  `;

  return {
    jobOfferId: offer.id,
    title: offer.title,
    embeddingDimensions: embedding.length,
  };
}