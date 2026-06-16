import type { CandidateProfileRagInput } from "@/lib/rag/candidate-profile-rag-document";
import type { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";

type ActiveSearchContext = NonNullable<
  Awaited<ReturnType<typeof getActiveSearchContext>>
>;

export function mapActiveSearchContextToCandidateProfileRagInput(
  context: ActiveSearchContext,
): CandidateProfileRagInput {
  const { candidateProfile, searchScenario } = context;

  return {
    name: candidateProfile.name,
    headline: candidateProfile.headline,
    level: candidateProfile.level,
    targetRoles: candidateProfile.targetRoles,
    strongSkills: candidateProfile.strongSkills,
    learningSkills: candidateProfile.learningSkills,
    preferredContracts: searchScenario.contractTypes,
    preferredRemote: searchScenario.remotePolicies
      .filter((policy) => policy !== "unknown")
      .join(", "),
    preferredLocations: searchScenario.locations,
    positiveSignals: candidateProfile.positiveSignals,
    negativeSignals: candidateProfile.negativeSignals,
    notes: [
      `Scénario actif : ${searchScenario.name}`,
      `Mots-clés du scénario : ${searchScenario.keywords.join(", ")}`,
      `Sources ciblées : ${searchScenario.sourceNames.join(", ")}`,
    ].join("\n"),
  };
}