import { prisma } from "@/lib/prisma";
import type { JobOffer } from "@/types/job-offer";
import { mapContractTypeFromDb } from "@/lib/offers/offer-normalization";
import { candidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";

export async function getOffers(): Promise<JobOffer[]> {
  const offers = await prisma.jobOffer.findMany({
    orderBy: {
      scrapedAt: "desc",
    },
    include: {
      analysis: true,
    },
  });

  const mappedOffers = offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: mapContractTypeFromDb(offer.contractType),
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    source: offer.source,
    url: offer.url,
    createdAt: offer.createdAt.toISOString(),
    analysis: offer.analysis
      ? {
          summary: offer.analysis.summary,
          requiredSkills: offer.analysis.requiredSkills,
          niceToHaveSkills: offer.analysis.niceToHaveSkills,
          experienceLevel: offer.analysis.experienceLevel,
          remotePolicy: offer.analysis.remotePolicy,
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
          analysisMode: offer.analysis.analysisMode,
          modelName: offer.analysis.modelName,
          inputTokens: offer.analysis.inputTokens,
          outputTokens: offer.analysis.outputTokens,
          totalTokens: offer.analysis.totalTokens,
        }
      : null,
    score: scoreJobOffer(
  {
    skills: offer.skills,
    contractType: mapContractTypeFromDb(offer.contractType),
    location: offer.location,
    qualityScore: offer.qualityScore,
    analysis: offer.analysis
      ? {
          experienceLevel: offer.analysis.experienceLevel as
            | "internship"
            | "junior"
            | "mid"
            | "senior"
            | "unknown",
          remotePolicy: offer.analysis.remotePolicy as
            | "on_site"
            | "hybrid"
            | "full_remote"
            | "unknown",
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
        }
      : null,
  },
  candidateProfile,
),
  }));

  return mappedOffers.sort((a, b) => {
    const scoreA = a.score?.percentage ?? 0;
    const scoreB = b.score?.percentage ?? 0;

    return scoreB - scoreA;
  });
}

export async function getOfferById(id: string): Promise<JobOffer | null> {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id,
    },
    include: {
      analysis: true,
    },
  });

  if (!offer) {
    return null;
  }

  return {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: mapContractTypeFromDb(offer.contractType),
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    source: offer.source,
    url: offer.url,
    createdAt: offer.createdAt.toISOString(),
    analysis: offer.analysis
      ? {
          summary: offer.analysis.summary,
          requiredSkills: offer.analysis.requiredSkills,
          niceToHaveSkills: offer.analysis.niceToHaveSkills,
          experienceLevel: offer.analysis.experienceLevel,
          remotePolicy: offer.analysis.remotePolicy,
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
          analysisMode: offer.analysis.analysisMode,
          modelName: offer.analysis.modelName,
          inputTokens: offer.analysis.inputTokens,
          outputTokens: offer.analysis.outputTokens,
          totalTokens: offer.analysis.totalTokens,
        }
      : null,
   score: scoreJobOffer(
  {
    skills: offer.skills,
    contractType: mapContractTypeFromDb(offer.contractType),
    location: offer.location,
    qualityScore: offer.qualityScore,
    analysis: offer.analysis
      ? {
          experienceLevel: offer.analysis.experienceLevel as
            | "internship"
            | "junior"
            | "mid"
            | "senior"
            | "unknown",
          remotePolicy: offer.analysis.remotePolicy as
            | "on_site"
            | "hybrid"
            | "full_remote"
            | "unknown",
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
        }
      : null,
  },
  candidateProfile,
),
  };
}