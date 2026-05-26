import { prisma } from "@/lib/prisma";

export type AgentOfferDetails = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  remote: boolean;
  skills: string[];
  description: string;
  url: string;
  analysis: {
    summary: string;
    requiredSkills: string[];
    niceToHaveSkills: string[];
    experienceLevel: string;
    remotePolicy: string;
    salaryMentioned: boolean;
    redFlags: string[];
    positiveSignals: string[];
  } | null;
};

export async function getOfferDetailsForAgent(
  offerId: string,
): Promise<AgentOfferDetails | null> {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id: offerId,
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
    contractType: offer.contractType,
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    url: offer.url,
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
        }
      : null,
  };
}