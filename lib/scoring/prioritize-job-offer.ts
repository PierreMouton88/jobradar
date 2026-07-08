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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);

  return keywords.some((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  );
}

function buildSearchableText(offer: ScorableJobOffer): string {
  return [
    offer.title ?? "",
    offer.description ?? "",
    offer.location,
    offer.contractType,
    ...offer.skills,
    ...(offer.analysis?.positiveSignals ?? []),
    ...(offer.analysis?.redFlags ?? []),
  ].join(" ");
}

function hasOutOfTargetTitle(offer: ScorableJobOffer): boolean {
  const title = offer.title ?? "";
  const searchableText = buildSearchableText(offer);

  const outOfTargetTitleKeywords = [
    "business developer",
    "business developpeur",
    "business development",
    "developpeur commercial",
    "commercial",
    "sales",
    "account manager",
    "charge d'affaires",
    "charge de developpement",
    "charge du developpement",
    "ingenieur commercial",
    "franchise",
    "animateur de reseau",
    "conseiller en gestion de patrimoine",
  ];

  const devStackKeywords = [
    "react",
    "typescript",
    "javascript",
    "node",
    "nestjs",
    "next",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "fullstack",
    "full stack",
    "api",
    "rest",
  ];

  return (
    containsAny(title, outOfTargetTitleKeywords) &&
    !containsAny(searchableText, devStackKeywords)
  );
}

function hasTargetJsStackSignal(offer: ScorableJobOffer): boolean {
  const searchableText = buildSearchableText(offer);

  return containsAny(searchableText, [
    "react",
    "typescript",
    "javascript",
    "node",
    "node.js",
    "nestjs",
    "next.js",
    "nextjs",
    "frontend",
    "front-end",
    "backend javascript",
    "backend node",
    "fullstack javascript",
    "full stack javascript",
    "fullstack react",
    "full stack react",
    "api rest node",
    "express",
    "prisma",
  ]);
}

function hasStrongDevSignal(offer: ScorableJobOffer): boolean {
  const searchableText = buildSearchableText(offer);

  return containsAny(searchableText, [
    "react",
    "typescript",
    "javascript",
    "node",
    "nestjs",
    "next.js",
    "nextjs",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "fullstack",
    "full stack",
    "api rest",
    "developpeur web",
    "software engineer",
  ]);
}

function hasStandaloneJavaSignal(text: string): boolean {
  const normalizedText = normalizeText(text);

  return /(^|[^a-z0-9])java([^a-z0-9]|$)/.test(normalizedText);
}

function hasNonTargetBackendStackSignal(offer: ScorableJobOffer): boolean {
  const searchableText = buildSearchableText(offer);

  return (
    hasStandaloneJavaSignal(searchableText) ||
    containsAny(searchableText, [
      ".net",
      "dotnet",
      "c#",
      "asp.net",
      "spring",
      "spring boot",
      "jee",
      "j2ee",
      "kotlin",
      "scala",
    ])
  );
}

function hasDominantNonTargetStack(offer: ScorableJobOffer): boolean {
  return (
    hasNonTargetBackendStackSignal(offer) && !hasTargetJsStackSignal(offer)
  );
}

function hasTrainingContractSignal(offer: ScorableJobOffer): boolean {
  const searchableText = buildSearchableText(offer);

  return (
    offer.contractType === "Alternance" ||
    offer.contractType === "Stage" ||
    containsAny(searchableText, [
      "alternance",
      "alternant",
      "apprenti",
      "apprentissage",
      "stage",
      "stagiaire",
    ])
  );
}

function hasExplicitEngineerRequirement(offer: ScorableJobOffer): boolean {
  const searchableText = buildSearchableText(offer);

  return containsAny(searchableText, [
    "ecole d'ingenieur",
    "diplome d'ingenieur",
    "formation ingenieur",
    "bac+5 obligatoire",
    "bac +5 obligatoire",
    "master 2 obligatoire",
    "diplome bac+5",
    "diplome bac +5",
  ]);
}

function addScoreReason(score: JobOfferScore, reasons: PriorityReason[]) {
  if (score.percentage >= 85) {
    reasons.push({
      type: "positive",
      label: "Score de compatibilité excellent",
    });

    return;
  }

  if (score.percentage >= 70) {
    reasons.push({
      type: "positive",
      label: "Score de compatibilité intéressant",
    });

    return;
  }

  if (score.percentage >= 50) {
    reasons.push({
      type: "action",
      label: "Compatibilité moyenne : offre à examiner sans priorité forte",
    });

    return;
  }

  reasons.push({
    type: "negative",
    label: "Score de compatibilité faible",
  });
}

export function prioritizeJobOffer(
  offer: ScorableJobOffer,
  score: JobOfferScore,
): PrioritizedOffer {
  const reasons: PriorityReason[] = [];

  const hasAnalysis = Boolean(offer.analysis);
  const hasSeniorLevel = offer.analysis?.experienceLevel === "senior";
  const hasMidLevel = offer.analysis?.experienceLevel === "mid";
  const hasManyRedFlags = (offer.analysis?.redFlags.length ?? 0) >= 3;
  const hasSomeRedFlags = (offer.analysis?.redFlags.length ?? 0) > 0;
  const hasLowQuality =
    offer.qualityScore !== undefined && offer.qualityScore < 50;
  const titleOutOfTarget = hasOutOfTargetTitle(offer);
  const strongDevSignal = hasStrongDevSignal(offer);
  const dominantNonTargetStack = hasDominantNonTargetStack(offer);
  const trainingContractSignal = hasTrainingContractSignal(offer);
  const explicitEngineerRequirement = hasExplicitEngineerRequirement(offer);

  if (titleOutOfTarget) {
    reasons.push({
      type: "negative",
      label:
        "Titre probablement hors cible développeur logiciel, sans signal technique compensatoire",
    });

    return {
      priority: "probably_ignore",
      label: "À ignorer probablement",
      reasons,
    };
  }

  addScoreReason(score, reasons);

  if (dominantNonTargetStack) {
    reasons.push({
      type: "negative",
      label:
        "Stack principale Java / .NET / C# détectée sans signal JavaScript / TypeScript suffisant",
    });

    return {
      priority: "low_priority",
      label: "Peu prioritaire",
      reasons,
    };
  }

  if (trainingContractSignal) {
    reasons.push({
      type: "negative",
      label:
        "Stage ou alternance détecté : contrat non prioritaire pour la recherche actuelle",
    });

    return {
      priority: "low_priority",
      label: "Peu prioritaire",
      reasons,
    };
  }

  if (hasSeniorLevel) {
    reasons.push({
      type: "negative",
      label:
        "Poste senior détecté : à examiner, mais pas ignoré automatiquement",
    });
  }

  if (hasMidLevel) {
    reasons.push({
      type: "negative",
      label: "Poste mid détecté : potentiellement exigeant mais jouable",
    });
  }

  if (explicitEngineerRequirement) {
    reasons.push({
      type: "negative",
      label: "Exigence diplôme ingénieur / Bac+5 détectée",
    });
  }

  if (hasSomeRedFlags) {
    reasons.push({
      type: "negative",
      label: "Point(s) de vigilance détecté(s) par l’analyse IA",
    });
  }

  if (hasLowQuality) {
    reasons.push({
      type: "negative",
      label: "Données de faible qualité : vérifier l’offre avant décision",
    });
  }

  if (!hasAnalysis && score.percentage >= 50) {
    reasons.push({
      type: "action",
      label: "Analyse IA absente : à analyser avant décision finale",
    });

    return {
      priority: "needs_ai_analysis",
      label: "À analyser avec IA",
      reasons,
    };
  }

  if (hasManyRedFlags && score.percentage < 70) {
    return {
      priority: "low_priority",
      label: "Peu prioritaire",
      reasons,
    };
  }

  if (hasManyRedFlags && score.percentage >= 70) {
    return {
      priority: "watch",
      label: "À surveiller",
      reasons,
    };
  }

  if (score.percentage >= 85 && !hasLowQuality) {
    return {
      priority: "very_promising",
      label: "Très prometteuse",
      reasons,
    };
  }

  if (score.percentage >= 70) {
    return {
      priority: "interesting",
      label: "Intéressante",
      reasons,
    };
  }

  if (score.percentage >= 50) {
    return {
      priority: strongDevSignal ? "watch" : "low_priority",
      label: strongDevSignal ? "À surveiller" : "Peu prioritaire",
      reasons,
    };
  }

  return {
    priority: "low_priority",
    label: "Peu prioritaire",
    reasons,
  };
}