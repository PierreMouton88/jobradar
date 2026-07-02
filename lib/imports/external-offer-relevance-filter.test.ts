import { describe, expect, it } from "vitest";
import type { CandidateProfile } from "@/lib/profile/candidate-profile";
import type { PreparedExternalJobOffer } from "@/lib/offers/import-external-job-offers";
import {
  filterExternalOffersByRelevance,
  scoreExternalOfferRelevance,
} from "./external-offer-relevance-filter";

const profile: CandidateProfile = {
  targetRole: "Développeur web junior / fullstack junior",
  level: "junior",
  strongSkills: ["React", "TypeScript", "JavaScript", "NestJS"],
  learningSkills: ["Next.js", "PostgreSQL", "Prisma", "Docker", "LLM", "RAG"],
  preferredRemotePolicies: ["hybrid", "full_remote"],
  preferredContractTypes: ["CDI", "Alternance"],
  preferredLocations: ["Nancy", "Metz", "Lorraine", "Remote"],
};

function createOffer(
  overrides: Partial<PreparedExternalJobOffer>,
): PreparedExternalJobOffer {
  return {
    externalId: "external-1",
    sourceProvider: "apify",
    sourceName: "indeed",
    sourceActor: null,

    title: "Développeur web React TypeScript",
    company: "Test Company",
    location: "Nancy (54)",
    contractType: "CDI",
    normalizedContractType:
      "CDI" as PreparedExternalJobOffer["normalizedContractType"],
    description:
      "Vous développerez des applications web en React, TypeScript et JavaScript. Vous travaillerez avec une équipe technique sur des API REST, des tests et de la qualité de code.",
    sourceUrl: "https://example.com/job-1",
    normalizedSourceUrl: "https://example.com/job-1",
    applyUrl: null,

    publishedAt: null,
    remoteHint: null,
    detectedRemote: false,

    salaryText: null,
    sourceTags: [],
    rawSkills: [],
    detectedSkills: ["React", "TypeScript", "JavaScript"],
    rawExperienceLevel: null,

    rawData: {},

    ...overrides,
  };
}

describe("scoreExternalOfferRelevance", () => {
  it("accepte une offre React TypeScript junior localisée dans la zone cible", () => {
    const offer = createOffer({
      title: "Développeur Front-End React TypeScript Junior",
      location: "Nancy (54)",
      contractType: "CDI",
      normalizedContractType:
        "CDI" as PreparedExternalJobOffer["normalizedContractType"],
      description:
        "Poste junior de développement front-end React, TypeScript et JavaScript. Vous serez accompagné par l'équipe, avec code review, API REST, tests unitaires et montée en compétence progressive.",
      detectedSkills: ["React", "TypeScript", "JavaScript"],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(true);
    expect(decision.score).toBeGreaterThanOrEqual(40);
  });

  it("rejette une offre commerciale qui utilise le mot développeur sans être un poste dev", () => {
    const offer = createOffer({
      title: "Business Développeur Régional EST H/F",
      company: "Hirsch Group",
      location: "Nancy (54)",
      description:
        "Développement commercial, prospection, négociation, animation de partenaires, gestion de portefeuille clients et participation à des salons professionnels.",
      detectedSkills: [],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(false);
    expect(decision.negativeReasons).toContain("titre hors cible commercial");
  });

  it("rejette une offre majoritairement commerciale même si le titre est ambigu", () => {
    const offer = createOffer({
      title: "Chargé de développement digital",
      location: "Metz (57)",
      description:
        "Prospection, négociation commerciale, portefeuille clients, CRM, cycle de vente, objectifs commerciaux et génération de leads.",
      detectedSkills: [],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(false);
    expect(decision.negativeReasons).toContain("titre hors cible commercial");
  });

  it("ne rejette pas automatiquement une offre senior si la stack est fortement pertinente", () => {
    const offer = createOffer({
      title: "Développeur Front-End Senior React TypeScript",
      location: "Metz (57)",
      description:
        "Développement front-end avec React, TypeScript, JavaScript, Next.js, Git, API REST, tests unitaires et code review. Le poste demande une expérience senior mais reste centré sur une stack très proche du profil.",
      detectedSkills: ["React", "TypeScript", "JavaScript", "Next.js", "Git"],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(true);
    expect(decision.negativeReasons).toContain(
      "niveau senior détecté mais non bloquant",
    );
  });

  it("ne pénalise pas une localisation custom passée par le run d'import", () => {
    const offer = createOffer({
      title: "Développeur Fullstack JavaScript",
      location: "Troyes (10)",
      description:
        "Développement web fullstack JavaScript avec API REST, Git, tests et participation à la conception technique.",
      detectedSkills: ["JavaScript", "Git"],
    });

    const decision = scoreExternalOfferRelevance(offer, profile, 40, [
      "Troyes",
    ]);

    expect(decision.accepted).toBe(true);
    expect(decision.positiveReasons).toContain(
      "localisation compatible avec le run ou le profil",
    );
  });

  it("accepte une offre technique imparfaite mais exploitable pour analyse ultérieure", () => {
    const offer = createOffer({
      title: "Développeur Full-stack PHP / JavaScript",
      location: "Nancy (54)",
      description:
        "Développement et évolution d'applications PHP et d'interfaces JavaScript dynamiques. Gestion de bases de données PostgreSQL, versioning Git, tests unitaires et travail en équipe. Les profils juniors à fort potentiel sont acceptés.",
      detectedSkills: ["JavaScript", "PostgreSQL", "Git"],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(true);
  });

  it("rejette une offre legacy très éloignée sans signal JavaScript ou web moderne", () => {
    const offer = createOffer({
      title: "Analyste Développeur COBOL AS400",
      location: "Metz (57)",
      description:
        "Maintenance applicative COBOL, AS400, RPG, support applicatif et environnement mainframe.",
      detectedSkills: [],
    });

    const decision = scoreExternalOfferRelevance(offer, profile);

    expect(decision.accepted).toBe(false);
    expect(decision.negativeReasons).toContain(
      "stack legacy très éloignée du profil",
    );
  });

  it("compte les raisons principales de rejet sur un lot d'offres", () => {
    const commercialOffer = createOffer({
      externalId: "commercial-1",
      title: "Business Developer sédentaire",
      description:
        "Prospection commerciale, vente, négociation et suivi de portefeuille clients.",
      detectedSkills: [],
    });

    const teachingOffer = createOffer({
      externalId: "teaching-1",
      title: "Professeur de blockchain",
      description:
        "Cours particuliers, enseignement, soutien scolaire et accompagnement d'élèves à distance.",
      detectedSkills: [],
    });

    const result = filterExternalOffersByRelevance({
      offers: [commercialOffer, teachingOffer],
      profile,
    });

    expect(result.acceptedOffers).toHaveLength(0);
    expect(result.rejectedOffers).toHaveLength(2);
    expect(result.reasonCounts.length).toBeGreaterThan(0);
  });
});