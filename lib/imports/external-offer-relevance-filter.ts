import type { CandidateProfile } from "@/lib/profile/candidate-profile";
import type { PreparedExternalJobOffer } from "@/lib/offers/import-external-job-offers";

export const DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE = 40;

export type ExternalOfferRelevanceDecision = {
  accepted: boolean;
  score: number;
  reasons: string[];
  positiveReasons: string[];
  negativeReasons: string[];
};

export type RejectedExternalOfferByRelevance = {
  offer: PreparedExternalJobOffer;
  score: number;
  reasons: string[];
};

export type ExternalOfferRelevanceReasonCount = {
  reason: string;
  count: number;
};

export type ExternalOfferRelevanceFilterResult = {
  minScore: number;
  acceptedOffers: PreparedExternalJobOffer[];
  rejectedOffers: RejectedExternalOfferByRelevance[];
  reasonCounts: ExternalOfferRelevanceReasonCount[];
};

export type FilterExternalOffersByRelevanceOptions = {
  offers: PreparedExternalJobOffer[];
  profile: CandidateProfile;
  minScore?: number;
  searchLocations?: string[];
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

function countMatches(text: string, keywords: string[]): number {
  const normalizedText = normalizeText(text);

  return keywords.filter((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  ).length;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function uniqueValues(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function getContractTypeValue(offer: PreparedExternalJobOffer): string {
  return normalizeText(String(offer.normalizedContractType));
}

function isPreferredContract(
  offer: PreparedExternalJobOffer,
  profile: CandidateProfile,
): boolean {
  const offerContract = getContractTypeValue(offer);

  return profile.preferredContractTypes.some(
    (contractType) => normalizeText(contractType) === offerContract,
  );
}

function hasCompatibleLocation(
  offer: PreparedExternalJobOffer,
  profile: CandidateProfile,
  searchLocations: string[] = [],
): boolean {
  const location = normalizeText(offer.location);

  const acceptedLocations = uniqueValues([
    ...searchLocations,
    ...profile.preferredLocations,
    "Grand Est",
    "Lorraine",
    "Alsace",
    "Moselle",
    "Meurthe-et-Moselle",
    "Bas-Rhin",
    "Haut-Rhin",
  ]);

  return acceptedLocations.some((acceptedLocation) =>
    location.includes(normalizeText(acceptedLocation)),
  );
}

function buildSearchableText(offer: PreparedExternalJobOffer): string {
  return [
    offer.title,
    offer.company,
    offer.location,
    offer.description,
    offer.contractType,
    offer.normalizedContractType,
    offer.rawExperienceLevel ?? "",
    ...offer.detectedSkills,
    ...offer.rawSkills,
    ...offer.sourceTags,
  ].join(" ");
}

function buildProfileTechKeywords(profile: CandidateProfile): string[] {
  return Array.from(
    new Set([
      ...profile.strongSkills,
      ...profile.learningSkills,
      "React",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "Node",
      "NestJS",
      "Next.js",
      "Frontend",
      "Front-end",
      "Backend",
      "Back-end",
      "Fullstack",
      "Full stack",
      "Web",
      "API",
      "REST",
      "PostgreSQL",
      "Prisma",
      "Docker",
      "Git",
    ]),
  );
}

function buildReasonCounts(
  rejectedOffers: RejectedExternalOfferByRelevance[],
): ExternalOfferRelevanceReasonCount[] {
  const counts = new Map<string, number>();

  for (const rejectedOffer of rejectedOffers) {
    for (const reason of rejectedOffer.reasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export function scoreExternalOfferRelevance(
  offer: PreparedExternalJobOffer,
  profile: CandidateProfile,
  minScore = DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE,
  searchLocations: string[] = [],
): ExternalOfferRelevanceDecision {
  let score = 0;

  const positiveReasons: string[] = [];
  const negativeReasons: string[] = [];

  const addPositive = (points: number, reason: string) => {
    score += points;
    positiveReasons.push(reason);
  };

  const addNegative = (points: number, reason: string) => {
    score -= points;
    negativeReasons.push(reason);
  };

  const title = normalizeText(offer.title);
  const fullText = buildSearchableText(offer);

  const targetTitleKeywords = [
    "developpeur web",
    "developpeuse web",
    "developpeur full stack",
    "developpeur fullstack",
    "developpeuse full stack",
    "developpeuse fullstack",
    "developpeur frontend",
    "developpeur front-end",
    "developpeuse frontend",
    "developpeuse front-end",
    "developpeur backend",
    "developpeur back-end",
    "developpeuse backend",
    "developpeuse back-end",
    "software engineer",
    "web developer",
    "frontend developer",
    "front-end developer",
    "backend developer",
    "back-end developer",
    "fullstack developer",
    "full stack developer",
    "concepteur developpeur web",
  ];

  const genericDeveloperTitleKeywords = [
    "developpeur",
    "developpeuse",
    "developer",
    "developpement logiciel",
    "ingenieur logiciel",
    "ingenieur d'etudes et developpement",
    "analyste developpeur",
    "concepteur developpeur",
  ];

  const commercialTitleKeywords = [
    "business developer",
    "business developpeur",
    "business development",
    "charge de developpement",
    "charge du developpement",
    "developpeur commercial",
    "ingenieur commercial",
    "commercial",
    "sales",
    "account manager",
    "animateur de reseau",
    "franchise",
    "conseiller en gestion de patrimoine",
  ];

  const commercialBodyKeywords = [
    "developpement commercial",
    "prospection",
    "negociation commerciale",
    "portefeuille clients",
    "cycle de vente",
    "vente b2b",
    "chiffre d'affaires",
    "objectifs commerciaux",
    "relation commerciale",
    "leads",
    "crm",
  ];

  const marketingKeywords = [
    "webmarketing",
    "marketing digital",
    "social ads",
    "campagnes display",
    "campagnes emailing",
    "communication digitale",
  ];

  const teachingKeywords = [
    "professeur",
    "enseignant",
    "formateur",
    "cours particuliers",
    "soutien scolaire",
  ];

  const supportKeywords = [
    "technicien support",
    "hotline",
    "assistance utilisateurs",
    "support applicatif",
    "support informatique",
  ];

  const legacyTitleKeywords = [
    "cobol",
    "as400",
    "rpg",
    "mainframe",
    "jcl",
    "db2",
  ];

  const nativeMobileTitleKeywords = [
    "android natif",
    "developpeur android",
    "developpeuse android",
    "developpeur ios",
    "developpeuse ios",
    "applications mobiles",
  ];

  const seniorKeywords = [
    "senior",
    "confirme",
    "experimente",
    "5 ans",
    "6 ans",
    "7 ans",
    "8 ans",
    "10 ans",
    "minimum 5",
    "minimum 7",
    "au moins 5",
    "au moins 7",
  ];

  const leadKeywords = [
    "lead developer",
    "lead dev",
    "tech lead",
    "responsable logiciel",
    "directeur",
    "head of",
  ];

  const juniorKeywords = [
    "junior",
    "debutant",
    "debutants",
    "premiere experience",
    "profils juniors",
    "profils debutants",
    "alternance",
    "apprenti",
    "apprentissage",
    "stage",
  ];

  const explicitEngineerRequirementKeywords = [
    "ecole d'ingenieur",
    "diplome d'ingenieur",
    "formation ingenieur",
    "bac+5 obligatoire",
    "bac +5 obligatoire",
    "master 2 obligatoire",
    "diplome bac+5",
    "diplome bac +5",
  ];

  const hasCommercialTitle = containsAny(title, commercialTitleKeywords);
  const hasTargetTitle = containsAny(title, targetTitleKeywords);
  const hasGenericDeveloperTitle = containsAny(
    title,
    genericDeveloperTitleKeywords,
  );

  const commercialBodySignalCount = countMatches(fullText, commercialBodyKeywords);
  const profileTechKeywords = buildProfileTechKeywords(profile);
  const matchedTechCount = countMatches(fullText, profileTechKeywords);
  const hasProfileTechMatch = matchedTechCount > 0;

  if (hasCommercialTitle) {
    addNegative(60, "titre hors cible commercial");
  }

  if (!hasTargetTitle && commercialBodySignalCount >= 3) {
    addNegative(35, "offre majoritairement commerciale");
  }

  if (!hasTargetTitle && containsAny(fullText, marketingKeywords)) {
    addNegative(30, "offre orientée marketing / acquisition");
  }

  if (containsAny(fullText, teachingKeywords)) {
    addNegative(35, "offre orientée enseignement / formation");
  }

  if (containsAny(fullText, supportKeywords) && !hasProfileTechMatch) {
    addNegative(15, "offre orientée support plutôt que développement");
  }

  if (!hasCommercialTitle) {
    if (hasTargetTitle) {
      addPositive(30, "titre orienté développement web / logiciel");
    } else if (hasGenericDeveloperTitle) {
      addPositive(18, "titre développeur générique");
    } else if (matchedTechCount >= 2) {
      addPositive(8, "titre peu clair mais stack technique pertinente");
    } else {
      addNegative(12, "titre peu aligné avec un poste développeur");
    }
  }

  if (matchedTechCount >= 4) {
    addPositive(30, "stack fortement alignée avec le profil");
  } else if (matchedTechCount >= 2) {
    addPositive(22, "stack partiellement alignée avec le profil");
  } else if (matchedTechCount === 1) {
    addPositive(12, "un signal technique aligné avec le profil");
  } else {
    addNegative(12, "aucun signal clair React / TypeScript / JavaScript / Node");
  }

  if (containsAny(title, legacyTitleKeywords) && !hasProfileTechMatch) {
    addNegative(22, "stack legacy très éloignée du profil");
  } else if (containsAny(fullText, legacyTitleKeywords) && !hasProfileTechMatch) {
    addNegative(12, "stack legacy présente mais non bloquante");
  }

  if (containsAny(title, nativeMobileTitleKeywords) && !hasProfileTechMatch) {
    addNegative(18, "poste mobile natif hors cible principale");
  } else if (containsAny(title, nativeMobileTitleKeywords)) {
    addNegative(8, "poste mobile natif, mais signaux web présents");
  }

  if (isPreferredContract(offer, profile)) {
    addPositive(8, "contrat compatible avec le profil");
  } else if (getContractTypeValue(offer) === "inconnu") {
    addPositive(3, "contrat inconnu mais non bloquant");
  } else {
    addNegative(4, "contrat moins prioritaire");
  }

  if (offer.detectedRemote) {
    addPositive(8, "remote ou hybride détecté");
  } else if (hasCompatibleLocation(offer, profile, searchLocations)) {
    addPositive(8, "localisation compatible avec le run ou le profil");
  }

  if (containsAny(fullText, juniorKeywords)) {
    addPositive(10, "niveau accessible ou junior détecté");
  } else if (containsAny(title, leadKeywords)) {
    addNegative(14, "responsabilités lead détectées mais non bloquantes");
  } else if (containsAny(fullText, seniorKeywords)) {
    addNegative(8, "niveau senior détecté mais non bloquant");
  } else {
    addPositive(5, "niveau non précisé, non bloquant");
  }

  if (containsAny(fullText, explicitEngineerRequirementKeywords)) {
    addNegative(8, "exigence diplôme ingénieur / Bac+5 détectée");
  }

  if (offer.description.length >= 800) {
    addPositive(8, "description exploitable");
  } else if (offer.description.length >= 250) {
    addPositive(4, "description courte mais exploitable");
  } else {
    addNegative(4, "description très courte");
  }

  if (
    containsAny(fullText, [
      "api",
      "rest",
      "tests",
      "test unitaire",
      "tests unitaires",
      "code review",
      "revue de code",
      "ci/cd",
      "docker",
      "postgresql",
      "prisma",
      "mentorat",
      "accompagnement",
      "montee en competence",
      "formation continue",
    ])
  ) {
    addPositive(6, "signaux techniques ou accompagnement intéressants");
  }

  const finalScore = clampScore(score);

  return {
    accepted: finalScore >= minScore,
    score: finalScore,
    reasons: [...positiveReasons, ...negativeReasons],
    positiveReasons,
    negativeReasons,
  };
}

export function filterExternalOffersByRelevance(
  options: FilterExternalOffersByRelevanceOptions,
): ExternalOfferRelevanceFilterResult {
  const minScore =
    options.minScore ?? DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE;

  const acceptedOffers: PreparedExternalJobOffer[] = [];
  const rejectedOffers: RejectedExternalOfferByRelevance[] = [];

  for (const offer of options.offers) {
    const decision = scoreExternalOfferRelevance(
      offer,
      options.profile,
      minScore,
      options.searchLocations,
    );

    if (decision.accepted) {
      acceptedOffers.push(offer);
      continue;
    }

    rejectedOffers.push({
      offer,
      score: decision.score,
      reasons:
        decision.negativeReasons.length > 0
          ? decision.negativeReasons
          : decision.reasons,
    });
  }

  return {
    minScore,
    acceptedOffers,
    rejectedOffers,
    reasonCounts: buildReasonCounts(rejectedOffers),
  };
}