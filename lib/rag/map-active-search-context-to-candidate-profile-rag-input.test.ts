import { describe, expect, it } from "vitest";
import { mapActiveSearchContextToCandidateProfileRagInput } from "./map-active-search-context-to-candidate-profile-rag-input";


describe("mapActiveSearchContextToCandidateProfileRagInput", () => {
  it("maps an active search context to a candidate profile RAG input", () => {
    const input = mapActiveSearchContextToCandidateProfileRagInput({
      candidateProfile: {
        name: "Pierre",
        headline: "Développeur Fullstack JavaScript / TypeScript junior",
        level: "junior",
        targetRoles: ["Développeur Fullstack", "Développeur Backend Node.js"],
        strongSkills: ["React", "TypeScript", "NestJS"],
        learningSkills: ["Next.js", "RAG"],
        positiveSignals: ["mentoring", "code review"],
        negativeSignals: ["poste senior", "autonomie totale immédiate"],
      },
      searchScenario: {
        name: "Grand Est — Fullstack / Backend JS",
        keywords: ["React", "TypeScript", "Node.js"],
        sourceNames: ["indeed", "linkedin"],
        contractTypes: ["CDI", "CDD"],
        remotePolicies: ["hybrid", "full_remote", "unknown"],
        locations: ["Metz", "Nancy", "Remote"],
      },
    } as Parameters<
      typeof mapActiveSearchContextToCandidateProfileRagInput
    >[0]);

    expect(input.name).toBe("Pierre");
    expect(input.headline).toBe(
      "Développeur Fullstack JavaScript / TypeScript junior",
    );
    expect(input.preferredContracts).toEqual(["CDI", "CDD"]);
    expect(input.preferredRemote).toBe("hybrid, full_remote");
    expect(input.preferredLocations).toEqual(["Metz", "Nancy", "Remote"]);
    expect(input.notes).toContain(
      "Scénario actif : Grand Est — Fullstack / Backend JS",
    );
    expect(input.notes).toContain("Sources ciblées : indeed, linkedin");
  });
});