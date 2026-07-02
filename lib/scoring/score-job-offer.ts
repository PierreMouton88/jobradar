import type { CandidateProfile } from "@/lib/profile/candidate-profile";

export type ScorableJobOffer = {
  title?: string;
  description?: string;
  skills: string[];
  contractType:
    | "CDI"
    | "CDD"
    | "Stage"
    | "Alternance"
    | "Freelance"
    | "Inconnu";
  location: string;
  qualityScore?: number;
  analysis?: {
    experienceLevel: "internship" | "junior" | "mid" | "senior" | "unknown";
    remotePolicy: "on_site" | "hybrid" | "full_remote" | "unknown";
    salaryMentioned: boolean;
    redFlags: string[];
    positiveSignals: string[];
  } | null;
};

export type ScoreExplanation = {
  label: string;
  points: number;
};

export type JobOfferScore = {
  score: number;
  maxScore: number;
  percentage: number;
  label: string;
  positiveExplanations: ScoreExplanation[];
  negativeExplanations: ScoreExplanation[];
};

type ScoreSection = {
  points: number;
  maxPoints: number;
  positiveExplanations: ScoreExplanation[];
  negativeExplanations: ScoreExplanation[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSkill(skill: string): string {
  return normalizeText(skill);
}

function containsAny(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);

  return keywords.some((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  );
}

function clampScore(score: number, maxScore: number): number {
  return Math.max(0, Math.min(maxScore, score));
}

function getScoreLabel(percentage: number): string {
  if (percentage >= 85) {
    return "Excellent match";
  }

  if (percentage >= 70) {
    return "Bon match";
  }

  if (percentage >= 50) {
    return "Match moyen";
  }

  return "Faible compatibilité";
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

function scoreTitleAlignment(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const title = offer.title ?? "";

  const targetTitleKeywords = [
    "développeur web",
    "developpeur web",
    "développeuse web",
    "developpeuse web",
    "développeur fullstack",
    "developpeur fullstack",
    "développeur full stack",
    "developpeur full stack",
    "développeur frontend",
    "developpeur frontend",
    "développeur front-end",
    "developpeur front-end",
    "développeur backend",
    "developpeur backend",
    "développeur back-end",
    "developpeur back-end",
    "software engineer",
    "web developer",
    "frontend developer",
    "backend developer",
    "fullstack developer",
    "full stack developer",
  ];

  const genericDeveloperKeywords = [
    "développeur",
    "developpeur",
    "développeuse",
    "developpeuse",
    "developer",
    "software",
    "ingénieur logiciel",
    "ingenieur logiciel",
    "concepteur développeur",
    "concepteur developpeur",
    "analyste développeur",
    "analyste developpeur",
  ];

  const outOfTargetKeywords = [
    "business developer",
    "business developpeur",
    "commercial",
    "sales",
    "account manager",
    "chargé d'affaires",
    "charge d'affaires",
    "franchise",
    "conseiller en gestion de patrimoine",
  ];

  if (containsAny(title, outOfTargetKeywords)) {
    negativeExplanations.push({
      label: "Titre probablement hors cible développeur logiciel",
      points: -15,
    });

    return {
      points: 0,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (containsAny(title, targetTitleKeywords)) {
    positiveExplanations.push({
      label: "Titre fortement aligné avec une cible dev web / fullstack",
      points: 15,
    });

    return {
      points: 15,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (containsAny(title, genericDeveloperKeywords)) {
    positiveExplanations.push({
      label: "Titre développeur compatible mais générique",
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: "Titre peu exploitable pour le scoring",
    points: 0,
  });

  return {
    points: 5,
    maxPoints: 15,
    positiveExplanations,
    negativeExplanations,
  };
}

export function scoreJobOfferSkills(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): JobOfferScore {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const offerSkills = Array.from(new Set(offer.skills.map(normalizeSkill)));
  const strongSkills = profile.strongSkills.map(normalizeSkill);
  const learningSkills = profile.learningSkills.map(normalizeSkill);

  let score = 0;

  for (const rawSkill of offer.skills) {
    const skill = normalizeSkill(rawSkill);

    if (strongSkills.includes(skill)) {
      score += 8;
      positiveExplanations.push({
        label: `${rawSkill} est une compétence forte du profil`,
        points: 8,
      });

      continue;
    }

    if (learningSkills.includes(skill)) {
      score += 4;
      positiveExplanations.push({
        label: `${rawSkill} est une compétence en apprentissage utile`,
        points: 4,
      });

      continue;
    }
  }

  const hasAnyProfileSkill = offerSkills.some(
    (skill) => strongSkills.includes(skill) || learningSkills.includes(skill),
  );

  if (!hasAnyProfileSkill && offer.skills.length > 0) {
    negativeExplanations.push({
      label: "Aucune compétence détectée ne correspond directement au profil",
      points: 0,
    });
  }

  if (offer.skills.length === 0) {
    negativeExplanations.push({
      label: "Compétences non détectées, section stack peu fiable",
      points: 0,
    });

    return {
      score: 12,
      maxScore: 30,
      percentage: 40,
      label: getScoreLabel(40),
      positiveExplanations,
      negativeExplanations,
    };
  }

  const cappedScore = clampScore(score, 30);
  const percentage = Math.round((cappedScore / 30) * 100);

  return {
    score: cappedScore,
    maxScore: 30,
    percentage,
    label: getScoreLabel(percentage),
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreSkillsSection(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): ScoreSection {
  const skillsScore = scoreJobOfferSkills(offer, profile);

  return {
    points: skillsScore.score,
    maxPoints: 30,
    positiveExplanations: skillsScore.positiveExplanations,
    negativeExplanations: skillsScore.negativeExplanations,
  };
}

function scoreExperienceLevel(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const offerLevel = offer.analysis?.experienceLevel;

  if (!offerLevel || offerLevel === "unknown") {
    positiveExplanations.push({
      label: "Niveau du poste inconnu, considéré comme non bloquant",
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offerLevel === profile.level) {
    positiveExplanations.push({
      label: `Niveau ${offerLevel} aligné avec le profil`,
      points: 15,
    });

    return {
      points: 15,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.level === "junior" && offerLevel === "internship") {
    positiveExplanations.push({
      label: "Poste accessible, mais probablement un peu trop junior",
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.level === "junior" && offerLevel === "mid") {
    negativeExplanations.push({
      label: "Poste mid potentiellement exigeant mais pas bloquant",
      points: 8,
    });

    return {
      points: 8,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.level === "junior" && offerLevel === "senior") {
    negativeExplanations.push({
      label: "Poste senior détecté, à examiner mais non ignoré automatiquement",
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Niveau ${offerLevel} différent du niveau recherché`,
    points: 7,
  });

  return {
    points: 7,
    maxPoints: 15,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreRemotePolicy(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const remotePolicy = offer.analysis?.remotePolicy;

  if (!remotePolicy || remotePolicy === "unknown") {
    positiveExplanations.push({
      label: "Politique remote inconnue, considérée comme non bloquante",
      points: 6,
    });

    return {
      points: 6,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.preferredRemotePolicies.includes(remotePolicy)) {
    positiveExplanations.push({
      label: `Politique remote compatible : ${remotePolicy}`,
      points: 8,
    });

    return {
      points: 8,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (remotePolicy === "on_site") {
    negativeExplanations.push({
      label: "Poste sur site, moins aligné avec les préférences remote",
      points: 4,
    });

    return {
      points: 4,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Politique remote moins prioritaire : ${remotePolicy}`,
    points: 5,
  });

  return {
    points: 5,
    maxPoints: 8,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreContractType(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (offer.contractType === "Inconnu") {
    positiveExplanations.push({
      label: "Type de contrat inconnu, considéré comme non bloquant",
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.preferredContractTypes.includes(offer.contractType)) {
    positiveExplanations.push({
      label: `Type de contrat recherché : ${offer.contractType}`,
      points: 8,
    });

    return {
      points: 8,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Type de contrat moins prioritaire : ${offer.contractType}`,
    points: 3,
  });

  return {
    points: 3,
    maxPoints: 8,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreLocation(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const normalizedLocation = normalizeText(offer.location);

  const matchingLocation = profile.preferredLocations.find((location) =>
    normalizedLocation.includes(normalizeText(location)),
  );

  if (matchingLocation) {
    positiveExplanations.push({
      label: `Localisation compatible : ${matchingLocation}`,
      points: 8,
    });

    return {
      points: 8,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (containsAny(offer.location, ["remote", "télétravail", "teletravail"])) {
    positiveExplanations.push({
      label: "Localisation compatible avec une logique remote",
      points: 7,
    });

    return {
      points: 7,
      maxPoints: 8,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Localisation hors préférences, mais non bloquante : ${offer.location}`,
    points: 4,
  });

  return {
    points: 4,
    maxPoints: 8,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreAiSignals(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (!offer.analysis) {
    positiveExplanations.push({
      label: "Analyse IA absente, scoring basé sur les données disponibles",
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  const positiveSignals = offer.analysis.positiveSignals;
  const redFlags = offer.analysis.redFlags;

  const positiveBonus = Math.min(positiveSignals.length * 2, 4);
  const redFlagPenalty = Math.min(redFlags.length * 2, 6);

  const points = clampScore(6 + positiveBonus - redFlagPenalty, 10);

  if (positiveSignals.length > 0) {
    positiveExplanations.push({
      label: `${positiveSignals.length} signal(aux) positif(s) détecté(s) par l’analyse IA`,
      points: positiveBonus,
    });
  }

  if (redFlags.length > 0) {
    negativeExplanations.push({
      label: `${redFlags.length} point(s) de vigilance détecté(s) par l’analyse IA`,
      points: -redFlagPenalty,
    });
  }

  if (positiveSignals.length === 0 && redFlags.length === 0) {
    positiveExplanations.push({
      label: "Analyse IA disponible sans point de vigilance majeur",
      points,
    });
  }

  return {
    points,
    maxPoints: 10,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreSalaryMention(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (offer.analysis?.salaryMentioned) {
    positiveExplanations.push({
      label: "Salaire mentionné dans l’offre",
      points: 2,
    });

    return {
      points: 2,
      maxPoints: 2,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: "Salaire non mentionné ou non évalué, impact faible",
    points: 1,
  });

  return {
    points: 1,
    maxPoints: 2,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreDataQuality(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (offer.qualityScore === undefined) {
    positiveExplanations.push({
      label: "Qualité des données non disponible, considérée comme neutre",
      points: 3,
    });

    return {
      points: 3,
      maxPoints: 4,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offer.qualityScore >= 80) {
    positiveExplanations.push({
      label: `Données de bonne qualité (${offer.qualityScore}/100)`,
      points: 4,
    });

    return {
      points: 4,
      maxPoints: 4,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offer.qualityScore >= 50) {
    positiveExplanations.push({
      label: `Données exploitables mais imparfaites (${offer.qualityScore}/100)`,
      points: 2,
    });

    return {
      points: 2,
      maxPoints: 4,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Données de faible qualité (${offer.qualityScore}/100)`,
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 4,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreExplicitRequirements(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const searchableText = buildSearchableText(offer);

  const explicitEngineerRequirementKeywords = [
    "école d'ingénieur",
    "ecole d'ingenieur",
    "diplôme d'ingénieur",
    "diplome d'ingenieur",
    "formation ingénieur",
    "formation ingenieur",
    "bac+5 obligatoire",
    "bac +5 obligatoire",
    "master 2 obligatoire",
    "diplôme bac+5",
    "diplome bac+5",
  ];

  if (containsAny(searchableText, explicitEngineerRequirementKeywords)) {
    negativeExplanations.push({
      label: "Exigence diplôme ingénieur / Bac+5 détectée",
      points: 2,
    });

    return {
      points: 2,
      maxPoints: 4,
      positiveExplanations,
      negativeExplanations,
    };
  }

  positiveExplanations.push({
    label: "Aucune exigence diplôme ingénieur / Bac+5 bloquante détectée",
    points: 4,
  });

  return {
    points: 4,
    maxPoints: 4,
    positiveExplanations,
    negativeExplanations,
  };
}

export function scoreJobOffer(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): JobOfferScore {
  const titleScore = scoreTitleAlignment(offer);
  const skillsScore = scoreSkillsSection(offer, profile);
  const levelScore = scoreExperienceLevel(offer, profile);
  const remoteScore = scoreRemotePolicy(offer, profile);
  const contractScore = scoreContractType(offer, profile);
  const locationScore = scoreLocation(offer, profile);
  const aiSignalsScore = scoreAiSignals(offer);
  const salaryScore = scoreSalaryMention(offer);
  const dataQualityScore = scoreDataQuality(offer);
  const explicitRequirementsScore = scoreExplicitRequirements(offer);

  const sections = [
    titleScore,
    skillsScore,
    levelScore,
    remoteScore,
    contractScore,
    locationScore,
    aiSignalsScore,
    salaryScore,
    dataQualityScore,
    explicitRequirementsScore,
  ];

  const score = sections.reduce((sum, section) => sum + section.points, 0);
  const maxScore = sections.reduce((sum, section) => sum + section.maxPoints, 0);
  const percentage = Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    percentage,
    label: getScoreLabel(percentage),
    positiveExplanations: sections.flatMap(
      (section) => section.positiveExplanations,
    ),
    negativeExplanations: sections.flatMap(
      (section) => section.negativeExplanations,
    ),
  };
}