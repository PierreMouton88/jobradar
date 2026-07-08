import { prisma } from "@/lib/prisma";
import type { CandidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import { prioritizeJobOffer } from "@/lib/scoring/prioritize-job-offer";
import { mapDbOfferToScorableOffer } from "@/lib/scoring/map-db-offer-to-scorable-offer";
import {
  selectAiAnalysisCandidates,
  type AiAnalysisCandidate,
} from "@/lib/ai/select-ai-analysis-candidates";

export type GetAiAnalysisCandidatesOptions = {
  profile: CandidateProfile;
  limit: number;
  sinceDate?: Date | null;
};

const REAL_SOURCE_FILTER = {
  NOT: [
    { source: { contains: "static-html" } },
    { source: { contains: "fake-dynamic-jobs" } },
    { source: { contains: "jobradar.local" } },
  ],
};

function buildCandidatesScopeFilter(sinceDate?: Date | null) {
  if (!sinceDate) {
    return REAL_SOURCE_FILTER;
  }

  return {
    AND: [
      REAL_SOURCE_FILTER,
      {
        createdAt: {
          gte: sinceDate,
        },
      },
    ],
  };
}

export async function getAiAnalysisCandidates({
  profile,
  limit,
  sinceDate = null,
}: GetAiAnalysisCandidatesOptions): Promise<AiAnalysisCandidate[]> {
  const offers = await prisma.jobOffer.findMany({
    where: buildCandidatesScopeFilter(sinceDate),
    include: {
      analysis: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const candidates: AiAnalysisCandidate[] = offers.map((offer) => {
    const scorableOffer = mapDbOfferToScorableOffer(offer);
    const score = scoreJobOffer(scorableOffer, profile);
    const priority = prioritizeJobOffer(scorableOffer, score);

    return {
      offer: {
        ...scorableOffer,
        id: offer.id,
        company: offer.company,
        url: offer.url,
      },
      score,
      priority,
    };
  });

  return selectAiAnalysisCandidates({
    candidates,
    limit,
  });
}