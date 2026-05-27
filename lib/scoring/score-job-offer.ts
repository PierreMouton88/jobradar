import type { CandidateProfile } from "@/lib/profile/candidate-profile";

export type ScorableJobOffer = {
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

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
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
export function scoreJobOfferSkills(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): JobOfferScore {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const offerSkills = offer.skills.map(normalizeSkill);
  const strongSkills = profile.strongSkills.map(normalizeSkill);
  const learningSkills = profile.learningSkills.map(normalizeSkill);

  let score = 0;
  const maxScore = offerSkills.length * 10;

  for (const rawSkill of offer.skills) {
    const skill = normalizeSkill(rawSkill);

    if (strongSkills.includes(skill)) {
      score += 10;
      positiveExplanations.push({
        label: `${rawSkill} est une compétence maîtrisée`,
        points: 10,
      });

      continue;
    }

    if (learningSkills.includes(skill)) {
      score += 5;
      positiveExplanations.push({
        label: `${rawSkill} est une compétence en apprentissage`,
        points: 5,
      });

      continue;
    }

    negativeExplanations.push({
      label: `${rawSkill} n’est pas encore dans le profil candidat`,
      points: 0,
    });
  }

  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    percentage,
    label: getScoreLabel(percentage),
    positiveExplanations,
    negativeExplanations,
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
    negativeExplanations.push({
      label: "Niveau du poste inconnu, score niveau non attribué",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 20,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offerLevel === profile.level) {
    positiveExplanations.push({
      label: `Niveau ${offerLevel} aligné avec le profil`,
      points: 20,
    });

    return {
      points: 20,
      maxPoints: 20,
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
      maxPoints: 20,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.level === "junior" && offerLevel === "mid") {
    negativeExplanations.push({
      label: "Poste potentiellement trop exigeant pour un profil junior",
      points: -10,
    });

    return {
      points: -10,
      maxPoints: 20,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.level === "junior" && offerLevel === "senior") {
    negativeExplanations.push({
      label: "Poste senior peu adapté à un profil junior",
      points: -20,
    });

    return {
      points: -20,
      maxPoints: 20,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Niveau ${offerLevel} différent du niveau recherché`,
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 20,
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
    negativeExplanations.push({
      label: "Politique remote inconnue, score remote non attribué",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.preferredRemotePolicies.includes(remotePolicy)) {
    positiveExplanations.push({
      label: `Politique remote compatible : ${remotePolicy}`,
      points: 15,
    });

    return {
      points: 15,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (remotePolicy === "on_site") {
    negativeExplanations.push({
      label:
        "Poste principalement sur site, moins aligné avec les préférences remote",
      points: -10,
    });

    return {
      points: -10,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Politique remote non prioritaire : ${remotePolicy}`,
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 15,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreRedFlags(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const redFlags = offer.analysis?.redFlags ?? [];

  if (redFlags.length === 0) {
    positiveExplanations.push({
      label: "Aucun point de vigilance majeur détecté par l’analyse IA",
      points: 15,
    });

    return {
      points: 15,
      maxPoints: 15,
      positiveExplanations,
      negativeExplanations,
    };
  }

  const penalty = Math.min(redFlags.length * 5, 20);

  negativeExplanations.push({
    label: `${redFlags.length} point(s) de vigilance détecté(s) par l’analyse IA`,
    points: -penalty,
  });

  return {
    points: -penalty,
    maxPoints: 15,
    positiveExplanations,
    negativeExplanations,
  };
}

function scorePositiveSignals(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  const positiveSignals = offer.analysis?.positiveSignals ?? [];

  if (positiveSignals.length === 0) {
    negativeExplanations.push({
      label: "Aucun signal positif particulier détecté par l’analyse IA",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  const points = Math.min(positiveSignals.length * 3, 10);

  positiveExplanations.push({
    label: `${positiveSignals.length} signal(aux) positif(s) détecté(s) par l’analyse IA`,
    points,
  });

  return {
    points,
    maxPoints: 10,
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
    negativeExplanations.push({
      label: "Type de contrat inconnu, score contrat non attribué",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (profile.preferredContractTypes.includes(offer.contractType)) {
    positiveExplanations.push({
      label: `Type de contrat recherché : ${offer.contractType}`,
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Type de contrat moins prioritaire : ${offer.contractType}`,
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 10,
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

  const normalizedLocation = offer.location.trim().toLowerCase();

  const matchingLocation = profile.preferredLocations.find((location) =>
    normalizedLocation.includes(location.trim().toLowerCase()),
  );

  if (matchingLocation) {
    positiveExplanations.push({
      label: `Localisation compatible : ${matchingLocation}`,
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Localisation moins prioritaire : ${offer.location}`,
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 10,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreSalaryMention(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (!offer.analysis) {
    negativeExplanations.push({
      label: "Salaire non évalué car l’analyse IA est absente",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 5,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offer.analysis.salaryMentioned) {
    positiveExplanations.push({
      label: "Salaire mentionné dans l’offre",
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 5,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: "Salaire non mentionné dans l’offre",
    points: 0,
  });

  return {
    points: 0,
    maxPoints: 5,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreDataQuality(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (offer.qualityScore === undefined) {
    negativeExplanations.push({
      label: "Qualité des données non disponible",
      points: 0,
    });

    return {
      points: 0,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offer.qualityScore >= 80) {
    positiveExplanations.push({
      label: `Données de bonne qualité (${offer.qualityScore}/100)`,
      points: 10,
    });

    return {
      points: 10,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  if (offer.qualityScore >= 50) {
    positiveExplanations.push({
      label: `Données exploitables mais imparfaites (${offer.qualityScore}/100)`,
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 10,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: `Données de faible qualité (${offer.qualityScore}/100)`,
    points: -10,
  });

  return {
    points: -10,
    maxPoints: 10,
    positiveExplanations,
    negativeExplanations,
  };
}

function scoreAnalysisPresence(offer: ScorableJobOffer): ScoreSection {
  const positiveExplanations: ScoreExplanation[] = [];
  const negativeExplanations: ScoreExplanation[] = [];

  if (offer.analysis) {
    positiveExplanations.push({
      label: "Analyse IA disponible pour affiner le score",
      points: 5,
    });

    return {
      points: 5,
      maxPoints: 5,
      positiveExplanations,
      negativeExplanations,
    };
  }

  negativeExplanations.push({
    label: "Analyse IA absente, score moins précis",
    points: -5,
  });

  return {
    points: -5,
    maxPoints: 5,
    positiveExplanations,
    negativeExplanations,
  };
}

export function scoreJobOffer(
  offer: ScorableJobOffer,
  profile: CandidateProfile,
): JobOfferScore {
  const skillsScore = scoreJobOfferSkills(offer, profile);
  const levelScore = scoreExperienceLevel(offer, profile);
  const remoteScore = scoreRemotePolicy(offer, profile);
  const redFlagsScore = scoreRedFlags(offer);
  const positiveSignalsScore = scorePositiveSignals(offer);
  const contractScore = scoreContractType(offer, profile);
  const locationScore = scoreLocation(offer, profile);
  const salaryScore = scoreSalaryMention(offer);
  const dataQualityScore = scoreDataQuality(offer);
  const analysisPresenceScore = scoreAnalysisPresence(offer);

  const score =
    skillsScore.score +
    levelScore.points +
    remoteScore.points +
    redFlagsScore.points +
    positiveSignalsScore.points +
    contractScore.points +
    locationScore.points +
    salaryScore.points +
    dataQualityScore.points +
    analysisPresenceScore.points;

  const maxScore =
    skillsScore.maxScore +
    levelScore.maxPoints +
    remoteScore.maxPoints +
    redFlagsScore.maxPoints +
    positiveSignalsScore.maxPoints +
    contractScore.maxPoints +
    locationScore.maxPoints +
    salaryScore.maxPoints +
    dataQualityScore.maxPoints +
    analysisPresenceScore.maxPoints;

  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    percentage,
    label: getScoreLabel(percentage),
    positiveExplanations: [
      ...skillsScore.positiveExplanations,
      ...levelScore.positiveExplanations,
      ...remoteScore.positiveExplanations,
      ...redFlagsScore.positiveExplanations,
      ...positiveSignalsScore.positiveExplanations,
      ...contractScore.positiveExplanations,
      ...locationScore.positiveExplanations,
      ...salaryScore.positiveExplanations,
      ...dataQualityScore.positiveExplanations,
      ...analysisPresenceScore.positiveExplanations,
    ],
    negativeExplanations: [
      ...skillsScore.negativeExplanations,
      ...levelScore.negativeExplanations,
      ...remoteScore.negativeExplanations,
      ...redFlagsScore.negativeExplanations,
      ...positiveSignalsScore.negativeExplanations,
      ...contractScore.negativeExplanations,
      ...locationScore.negativeExplanations,
      ...salaryScore.negativeExplanations,
      ...dataQualityScore.negativeExplanations,
      ...analysisPresenceScore.negativeExplanations,
    ],
  };
}
