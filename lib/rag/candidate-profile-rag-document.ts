export type CandidateProfileRagInput = {
  name: string;
  headline: string;
  level: string;
  targetRoles: string[];
  strongSkills: string[];
  learningSkills: string[];
  preferredContracts: string[];
  preferredRemote: string;
  preferredLocations: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  notes?: string | null;
};

function formatList(items: string[], fallback = "Non renseigné"): string {
  return items.length > 0 ? items.join(", ") : fallback;
}

export function buildCandidateProfileRagDocument(
  profile: CandidateProfileRagInput,
): string {
  return `Type de document : Profil candidat
Nom : ${profile.name}
Titre professionnel : ${profile.headline}
Niveau : ${profile.level}

Postes ciblés :
${formatList(profile.targetRoles)}

Compétences fortes :
${formatList(profile.strongSkills)}

Compétences en apprentissage :
${formatList(profile.learningSkills)}

Contrats recherchés :
${formatList(profile.preferredContracts)}

Préférence télétravail :
${profile.preferredRemote || "Non renseigné"}

Localisations préférées :
${formatList(profile.preferredLocations)}

Signaux positifs recherchés dans une offre :
${formatList(profile.positiveSignals)}

Points de vigilance dans une offre :
${formatList(profile.negativeSignals)}

Notes complémentaires :
${profile.notes?.trim() ? profile.notes : "Non renseigné"}
`;
}