export type CandidateProfile = {
  targetRole: string;
  level: "internship" | "junior" | "mid" | "senior";
  strongSkills: string[];
  learningSkills: string[];
  preferredRemotePolicies: Array<"on_site" | "hybrid" | "full_remote">;
  preferredContractTypes: Array<
    "CDI" | "CDD" | "Stage" | "Alternance" | "Freelance"
  >;
  preferredLocations: string[];
};

export const candidateProfile: CandidateProfile = {
  targetRole: "Développeur web junior / fullstack junior",
  level: "junior",
  strongSkills: ["React", "TypeScript", "JavaScript", "NestJS"],
  learningSkills: ["Next.js", "PostgreSQL", "Prisma", "Docker", "LLM", "RAG"],
  preferredRemotePolicies: ["hybrid", "full_remote"],
  preferredContractTypes: ["CDI", "CDD"],
  preferredLocations: ["Nancy", "Metz", "Lorraine", "Remote"],
};