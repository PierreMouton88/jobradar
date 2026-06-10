import type {
  JobOfferScore,
  ScorableJobOffer,
} from "@/lib/scoring/score-job-offer";

export type OfferPriorityLevel =
  | "very_promising"
  | "interesting"
  | "needs_ai_analysis"
  | "watch"
  | "low_priority"
  | "probably_ignore";

export type PriorityReasonType = "positive" | "negative" | "action";

export type PriorityReason = {
  type: PriorityReasonType;
  label: string;
};

export type PrioritizedOffer = {
  priority: OfferPriorityLevel;
  label: string;
  reasons: PriorityReason[];
};

function hasOutOfTargetTitle(title: string | undefined): boolean {
  if (!title) {
    return false;
  }

  const normalizedTitle = title.toLowerCase();

  const outOfTargetKeywords = [
    "business developer",
    "business développeur",
    "commercial",
    "sales",
    "account manager",
    "chargé d'affaires",
    "charge d'affaires",
    "business development",
  ];

  return outOfTargetKeywords.some((keyword) =>
    normalizedTitle.includes(keyword),
  );
}

export function prioritizeJobOffer(
  offer: ScorableJobOffer,
  score: JobOfferScore,
): PrioritizedOffer {
  const reasons: PriorityReason[] = [];

  const hasAnalysis = Boolean(offer.analysis);
  const hasSeniorLevel = offer.analysis?.experienceLevel === "senior";
  const hasManyRedFlags = (offer.analysis?.redFlags.length ?? 0) >= 3;
  const hasLowQuality =
    offer.qualityScore !== undefined && offer.qualityScore < 50;
  const hasTitleOutOfTarget = hasOutOfTargetTitle(offer.title);
  if (hasSeniorLevel) {
    reasons.push({
      type: "negative",
      label: "Poste senior probablement peu adapté au profil actuel",
    });

    return {
      priority: "probably_ignore",
      label: "À ignorer probablement",
      reasons,
    };
  }

  if (hasManyRedFlags) {
    reasons.push({
      type: "negative",
      label: "Plusieurs points de vigilance détectés par l’analyse IA",
    });

    return {
      priority: "low_priority",
      label: "Peu prioritaire",
      reasons,
    };
  }
  if (hasTitleOutOfTarget) {
    reasons.push({
      type: "negative",
      label: "Titre d’offre probablement hors cible développeur",
    });

    return {
      priority: "probably_ignore",
      label: "À ignorer probablement",
      reasons,
    };
  }
  if (!hasAnalysis && score.percentage >= 50) {
    reasons.push({
      type: "action",
      label: "Score correct mais analyse IA absente : à analyser en priorité",
    });

    return {
      priority: "needs_ai_analysis",
      label: "À analyser avec IA",
      reasons,
    };
  }

  if (score.percentage >= 80 && !hasLowQuality) {
    reasons.push({
      type: "positive",
      label: "Score de compatibilité élevé",
    });

    return {
      priority: "very_promising",
      label: "Très prometteuse",
      reasons,
    };
  }

  if (score.percentage >= 65) {
    reasons.push({
      type: "positive",
      label: "Score de compatibilité intéressant",
    });

    return {
      priority: "interesting",
      label: "Intéressante",
      reasons,
    };
  }

  if (score.percentage >= 45) {
    reasons.push({
      type: "action",
      label:
        "Compatibilité moyenne : offre à surveiller sans priorité immédiate",
    });

    return {
      priority: "watch",
      label: "À surveiller",
      reasons,
    };
  }

  reasons.push({
    type: "negative",
    label: "Score de compatibilité faible",
  });

  return {
    priority: "low_priority",
    label: "Peu prioritaire",
    reasons,
  };
}
