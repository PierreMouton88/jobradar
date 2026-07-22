import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CandidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import { prioritizeJobOffer } from "@/lib/scoring/prioritize-job-offer";
import { mapDbOfferToScorableOffer } from "@/lib/scoring/map-db-offer-to-scorable-offer";
import {
  selectAiAnalysisCandidates,
  type AiAnalysisCandidate,
} from "@/lib/ai/select-ai-analysis-candidates";

const DEFAULT_CANDIDATE_LOOKUP_LIMIT = 50;

export type GetAiAnalysisCandidatesOptions = {
  profile: CandidateProfile;
  limit: number;
  sinceDate?: Date | null;
  jobOfferIds?: string[] | null;
};

export type AiAnalysisCandidatesQueryScope = {
  where: Prisma.JobOfferWhereInput;
  take: number;
};

const REAL_SOURCE_FILTER: Prisma.JobOfferWhereInput = {
  NOT: [
    { source: { contains: "static-html" } },
    { source: { contains: "fake-dynamic-jobs" } },
    { source: { contains: "jobradar.local" } },
  ],
};

function normalizeJobOfferIds(
  jobOfferIds: string[] | null | undefined,
): string[] | null {
  if (jobOfferIds === undefined || jobOfferIds === null) {
    return null;
  }

  return Array.from(new Set(jobOfferIds));
}

export function buildAiAnalysisCandidatesQueryScope(input: {
  sinceDate?: Date | null;
  jobOfferIds?: string[] | null;
}): AiAnalysisCandidatesQueryScope {
  const normalizedJobOfferIds = normalizeJobOfferIds(input.jobOfferIds);

  const filters: Prisma.JobOfferWhereInput[] = [
    REAL_SOURCE_FILTER,

    // Garde-fou économique :
    // une offre déjà analysée ne doit pas être renvoyée comme candidate.
    {
      analysis: null,
    },
  ];

  if (input.sinceDate) {
    filters.push({
      createdAt: {
        gte: input.sinceDate,
      },
    });
  }

  if (normalizedJobOfferIds !== null) {
    filters.push({
      id: {
        in: normalizedJobOfferIds,
      },
    });
  }

  return {
    where: {
      AND: filters,
    },

    // Sans batch explicite, on conserve la limite historique.
    // Avec un batch, on inspecte tout le batch, même s’il contient plus
    // de 50 offres.
    take:
      normalizedJobOfferIds === null
        ? DEFAULT_CANDIDATE_LOOKUP_LIMIT
        : normalizedJobOfferIds.length,
  };
}

export async function getAiAnalysisCandidates({
  profile,
  limit,
  sinceDate = null,
  jobOfferIds = null,
}: GetAiAnalysisCandidatesOptions): Promise<AiAnalysisCandidate[]> {
  if (limit === 0) {
    return [];
  }

  const queryScope = buildAiAnalysisCandidatesQueryScope({
    sinceDate,
    jobOfferIds,
  });

  // Une liste vide signifie explicitement :
  // « aucune offre de ce batch », pas « toutes les offres ».
  if (queryScope.take === 0) {
    return [];
  }

  const offers = await prisma.jobOffer.findMany({
    where: queryScope.where,
    include: {
      analysis: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: queryScope.take,
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