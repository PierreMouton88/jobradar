import { prisma } from "@/lib/prisma";

export type AgentSearchOfferResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  remote: boolean;
  skills: string[];
  scorePercentage: number | null;
  analysis: {
    experienceLevel: string;
    remotePolicy: string;
    salaryMentioned: boolean;
    redFlags: string[];
    positiveSignals: string[];
  } | null;
};

export async function searchOffersForAgent(
  query: string,
): Promise<AgentSearchOfferResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const offers = await prisma.jobOffer.findMany({
    where: {
      OR: terms.flatMap((term) => [
        {
          title: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          company: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: term,
            mode: "insensitive",
          },
        },
      ]),
    },
    include: {
      analysis: true,
    },
    take: 5,
    orderBy: {
      scrapedAt: "desc",
    },
  });

  return offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: offer.contractType,
    remote: offer.remote,
    skills: offer.skills,
    scorePercentage: null,
    analysis: offer.analysis
      ? {
          experienceLevel: offer.analysis.experienceLevel,
          remotePolicy: offer.analysis.remotePolicy,
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
        }
      : null,
  }));
}
