import { describe, expect, it } from "vitest";

import {
  type JobOfferForRagCandidate,
  buildJobOfferRagCandidate,
} from "@/lib/rag/build-job-offer-rag-candidate";
import { RAG_EMBEDDING_MODEL_NAME } from "@/lib/rag/rag-embedding-config";

function createOffer(
  overrides: Partial<JobOfferForRagCandidate> = {},
): JobOfferForRagCandidate {
  return {
    id: "offer-1",
    title: "Développeur TypeScript",
    company: "Acme",
    location: "Metz",
    contractType: "CDI",
    remote: true,
    skills: ["TypeScript", "React"],
    description: "Développement d’une application TypeScript.",
    source: "linkedin",
    url: "https://example.com/offers/1",
    analysis: null,
    ...overrides,
  };
}

describe("buildJobOfferRagCandidate", () => {
  it("construit une candidate RAG complète sans analyse IA", () => {
    const candidate = buildJobOfferRagCandidate(createOffer());

    expect(candidate).toMatchObject({
      sourceId: "offer-1",
      title: "Développeur TypeScript — Acme",
      modelName: RAG_EMBEDDING_MODEL_NAME,
      metadata: {
        jobOfferId: "offer-1",
        title: "Développeur TypeScript",
        company: "Acme",
        location: "Metz",
        contractType: "CDI",
        remote: true,
        source: "linkedin",
        url: "https://example.com/offers/1",
        hasAnalysis: false,
      },
    });

    expect(candidate.content).toContain(
      "Titre : Développeur TypeScript",
    );
    expect(candidate.content).toContain(
      "Aucune analyse précédente",
    );
    expect(candidate.content).toContain(
      "Description :\nDéveloppement d’une application TypeScript.",
    );
  });

  it("intègre l’analyse IA au contenu et aux métadonnées", () => {
    const candidate = buildJobOfferRagCandidate(
      createOffer({
        analysis: {
          summary: "Poste accessible à un profil junior TypeScript.",
          requiredSkills: ["TypeScript", "Node.js"],
          niceToHaveSkills: ["Docker"],
          experienceLevel: "junior",
          remotePolicy: "hybrid",
          redFlags: ["Astreintes possibles"],
          positiveSignals: ["Mentorat"],
        },
      }),
    );

    expect(candidate.metadata).toMatchObject({
      hasAnalysis: true,
    });

    expect(candidate.content).toContain(
      "Poste accessible à un profil junior TypeScript.",
    );
    expect(candidate.content).toContain(
      "TypeScript, Node.js",
    );
    expect(candidate.content).toContain("Mentorat");
    expect(candidate.content).toContain("Astreintes possibles");
  });

  it("utilise uniquement le titre lorsque l’entreprise est vide", () => {
    const candidate = buildJobOfferRagCandidate(
      createOffer({
        company: "",
      }),
    );

    expect(candidate.title).toBe("Développeur TypeScript");
  });
});