import { describe, expect, it } from "vitest";
import { buildCandidateProfileRagDocument } from "./candidate-profile-rag-document";



describe("buildCandidateProfileRagDocument", () => {
  it("builds a readable RAG document from a candidate profile", () => {
    const document = buildCandidateProfileRagDocument({
      name: "Pierre",
      headline: "Développeur Fullstack JavaScript / TypeScript junior",
      level: "junior",
      targetRoles: ["Développeur Fullstack", "Développeur Backend Node.js"],
      strongSkills: ["React", "TypeScript", "NestJS"],
      learningSkills: ["Next.js", "RAG", "Agents IA"],
      preferredContracts: ["CDI", "CDD"],
      preferredRemote: "hybrid",
      preferredLocations: ["Metz", "Nancy", "Luxembourg", "Remote"],
      positiveSignals: ["mentoring", "code review", "équipe technique"],
      negativeSignals: ["poste senior", "autonomie totale immédiate"],
      notes: "Appétence backend, architecture, données et IA appliquée.",
    });

    expect(document).toContain("Type de document : Profil candidat");
    expect(document).toContain("Pierre");
    expect(document).toContain("React, TypeScript, NestJS");
    expect(document).toContain("mentoring, code review, équipe technique");
    expect(document).toContain("poste senior, autonomie totale immédiate");
  });

  it("uses fallback text when optional lists are empty", () => {
    const document = buildCandidateProfileRagDocument({
      name: "Pierre",
      headline: "Développeur Fullstack",
      level: "junior",
      targetRoles: [],
      strongSkills: [],
      learningSkills: [],
      preferredContracts: [],
      preferredRemote: "",
      preferredLocations: [],
      positiveSignals: [],
      negativeSignals: [],
      notes: "",
    });

    expect(document).toContain("Postes ciblés :\nNon renseigné");
    expect(document).toContain("Compétences fortes :\nNon renseigné");
    expect(document).toContain("Préférence télétravail :\nNon renseigné");
    expect(document).toContain("Notes complémentaires :\nNon renseigné");
  });
});