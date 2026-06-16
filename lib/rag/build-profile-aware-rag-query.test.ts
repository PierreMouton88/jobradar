import { describe, expect, it } from "vitest";
import { buildProfileAwareRagQuery } from "./build-profile-aware-rag-query";



describe("buildProfileAwareRagQuery", () => {
  it("enriches a user question with candidate profile information", () => {
    const query = buildProfileAwareRagQuery(
      "Quelles offres sont les plus cohérentes ?",
      {
        name: "Pierre",
        headline: "Développeur Fullstack JavaScript / TypeScript junior",
        level: "junior",
        targetRoles: ["Développeur React / Node.js"],
        strongSkills: ["React", "TypeScript", "Node.js"],
        learningSkills: ["Next.js", "RAG"],
        preferredContracts: ["CDI", "CDD"],
        preferredRemote: "hybrid, full_remote",
        preferredLocations: ["Metz", "Nancy", "Strasbourg"],
        positiveSignals: ["mentoring", "code review"],
        negativeSignals: ["poste senior", "autonomie totale immédiate"],
      },
    );

    expect(query).toContain("Quelles offres sont les plus cohérentes ?");
    expect(query).toContain(
      "Profil candidat : Développeur Fullstack JavaScript / TypeScript junior",
    );
    expect(query).toContain("Niveau : junior");
    expect(query).toContain("Compétences fortes : React, TypeScript, Node.js");
    expect(query).toContain("Localisations souhaitées : Metz, Nancy, Strasbourg");
    expect(query).toContain("Points de vigilance : poste senior");
  });
});