import type { CandidateProfile as DbCandidateProfile } from "@prisma/client";
import type { CandidateProfile as ScoringCandidateProfile } from "@/lib/profile/candidate-profile";

export function mapCandidateProfileToScoringProfile(
  profile: DbCandidateProfile,
): ScoringCandidateProfile {
  return {
    targetRole: profile.targetRoles[0] ?? profile.headline,
    level: mapCandidateLevel(profile.level),
    strongSkills: profile.strongSkills,
    learningSkills: profile.learningSkills,
    preferredRemotePolicies: mapPreferredRemotePolicies(profile.preferredRemote),
    preferredContractTypes: mapPreferredContractTypes(profile.preferredContracts),
    preferredLocations: profile.preferredLocations,
  };
}

function mapCandidateLevel(
  level: string,
): ScoringCandidateProfile["level"] {
  if (
    level === "internship" ||
    level === "junior" ||
    level === "mid" ||
    level === "senior"
  ) {
    return level;
  }

  return "junior";
}

function mapPreferredRemotePolicies(
  preferredRemote: string,
): ScoringCandidateProfile["preferredRemotePolicies"] {
  if (preferredRemote === "full_remote") {
    return ["full_remote"];
  }

  if (preferredRemote === "hybrid_or_full_remote") {
    return ["hybrid", "full_remote"];
  }

  if (preferredRemote === "hybrid") {
    return ["hybrid"];
  }

  if (preferredRemote === "on_site") {
    return ["on_site"];
  }

  return ["hybrid", "full_remote"];
}

function mapPreferredContractTypes(
  preferredContracts: string[],
): ScoringCandidateProfile["preferredContractTypes"] {
  const allowedContractTypes: ScoringCandidateProfile["preferredContractTypes"] = [
    "CDI",
    "CDD",
    "Stage",
    "Alternance",
    "Freelance",
  ];

  return preferredContracts.filter(
    (contractType): contractType is ScoringCandidateProfile["preferredContractTypes"][number] =>
      allowedContractTypes.includes(contractType as ScoringCandidateProfile["preferredContractTypes"][number]),
  );
}