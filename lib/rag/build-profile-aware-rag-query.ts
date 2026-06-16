import { CandidateProfileRagInput } from "./candidate-profile-rag-document";


export function buildProfileAwareRagQuery(
  question: string,
  profile: CandidateProfileRagInput,
): string {
  const parts = [
    question.trim(),
    `Profil candidat : ${profile.headline}`,
    `Niveau : ${profile.level}`,
    `Postes ciblés : ${profile.targetRoles.join(", ")}`,
    `Compétences fortes : ${profile.strongSkills.join(", ")}`,
    `Compétences en apprentissage : ${profile.learningSkills.join(", ")}`,
    `Contrats recherchés : ${profile.preferredContracts.join(", ")}`,
    `Télétravail souhaité : ${profile.preferredRemote}`,
    `Localisations souhaitées : ${profile.preferredLocations.join(", ")}`,
    `Signaux positifs : ${profile.positiveSignals.join(", ")}`,
    `Points de vigilance : ${profile.negativeSignals.join(", ")}`,
  ];

  return parts.filter((part) => part.trim().length > 0).join("\n");
}