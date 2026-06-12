import type { Prisma } from "@prisma/client";

import { mapContractTypeFromDb } from "@/lib/offers/offer-normalization";
import type { ScorableJobOffer } from "@/lib/scoring/score-job-offer";

type DbOfferWithAnalysis = Prisma.JobOfferGetPayload<{
  include: {
    analysis: true;
  };
}>;

function mapExperienceLevelForScoring(
  experienceLevel: string,
): NonNullable<ScorableJobOffer["analysis"]>["experienceLevel"] {
  switch (experienceLevel) {
    case "internship":
    case "junior":
    case "mid":
    case "senior":
    case "unknown":
      return experienceLevel;

    default:
      return "unknown";
  }
}

function mapRemotePolicyForScoring(
  remotePolicy: string,
): NonNullable<ScorableJobOffer["analysis"]>["remotePolicy"] {
  switch (remotePolicy) {
    case "on_site":
    case "hybrid":
    case "full_remote":
    case "unknown":
      return remotePolicy;

    default:
      return "unknown";
  }
}

export function mapDbOfferToScorableOffer(
  offer: DbOfferWithAnalysis,
): ScorableJobOffer {
  return {
    title: offer.title,
    skills: offer.skills,
    contractType: mapContractTypeFromDb(offer.contractType),
    location: offer.location,
    qualityScore: offer.qualityScore,
    analysis: offer.analysis
      ? {
          experienceLevel: mapExperienceLevelForScoring(
            offer.analysis.experienceLevel,
          ),
          remotePolicy: mapRemotePolicyForScoring(
            offer.analysis.remotePolicy,
          ),
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
        }
      : null,
  };
}