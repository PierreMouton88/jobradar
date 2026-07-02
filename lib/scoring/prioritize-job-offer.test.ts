import { describe, expect, it } from "vitest";
import type {
  JobOfferScore,
  ScorableJobOffer,
} from "@/lib/scoring/score-job-offer";
import { prioritizeJobOffer } from "./prioritize-job-offer";

function createScore(percentage: number): JobOfferScore {
  return {
    score: percentage,
    maxScore: 100,
    percentage,
    label: "Test score",
    positiveExplanations: [],
    negativeExplanations: [],
  };
}

function createOffer(overrides: Partial<ScorableJobOffer>): ScorableJobOffer {
  return {
    title: "Développeur Front-End React TypeScript",
    description:
      "Développement web avec React, TypeScript, JavaScript, API REST et tests.",
    skills: ["React", "TypeScript", "JavaScript"],
    contractType: "CDI",
    location: "Metz",
    qualityScore: 90,
    analysis: {
      experienceLevel: "junior",
      remotePolicy: "hybrid",
      salaryMentioned: false,
      redFlags: [],
      positiveSignals: [],
    },
    ...overrides,
  };
}

describe("prioritizeJobOffer", () => {
  it("ne met plus automatiquement une offre senior pertinente en ignore", () => {
    const offer = createOffer({
      title: "Développeur Front-End Senior React TypeScript",
      analysis: {
        experienceLevel: "senior",
        remotePolicy: "hybrid",
        salaryMentioned: false,
        redFlags: [],
        positiveSignals: ["Stack React TypeScript pertinente"],
      },
    });

    const priority = prioritizeJobOffer(offer, createScore(78));

    expect(priority.priority).toBe("interesting");
    expect(priority.label).toBe("Intéressante");
    expect(priority.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label:
            "Poste senior détecté : à examiner, mais pas ignoré automatiquement",
        }),
      ]),
    );
  });

  it("garde une offre sans analyse IA en priorité d'analyse si le score est correct", () => {
    const offer = createOffer({
      analysis: null,
    });

    const priority = prioritizeJobOffer(offer, createScore(72));

    expect(priority.priority).toBe("needs_ai_analysis");
    expect(priority.label).toBe("À analyser avec IA");
  });

  it("continue à ignorer une offre business developer sans signal technique", () => {
    const offer = createOffer({
      title: "Business Developer sédentaire",
      description:
        "Prospection commerciale, vente, négociation et suivi de portefeuille clients.",
      skills: [],
      analysis: {
        experienceLevel: "unknown",
        remotePolicy: "unknown",
        salaryMentioned: false,
        redFlags: [],
        positiveSignals: [],
      },
    });

    const priority = prioritizeJobOffer(offer, createScore(65));

    expect(priority.priority).toBe("probably_ignore");
    expect(priority.label).toBe("À ignorer probablement");
  });

  it("déclasse une bonne offre avec beaucoup de red flags en surveillance", () => {
    const offer = createOffer({
      analysis: {
        experienceLevel: "junior",
        remotePolicy: "hybrid",
        salaryMentioned: false,
        redFlags: [
          "Autonomie très forte attendue",
          "Contexte peu encadré",
          "Charge importante",
        ],
        positiveSignals: ["Stack pertinente"],
      },
    });

    const priority = prioritizeJobOffer(offer, createScore(76));

    expect(priority.priority).toBe("watch");
    expect(priority.label).toBe("À surveiller");
  });

  it("classe une offre très bien scorée et propre comme très prometteuse", () => {
    const offer = createOffer({});

    const priority = prioritizeJobOffer(offer, createScore(88));

    expect(priority.priority).toBe("very_promising");
    expect(priority.label).toBe("Très prometteuse");
  });

  it("classe une offre moyenne avec signal dev fort en surveillance", () => {
    const offer = createOffer({
      title: "Développeur JavaScript",
      skills: ["JavaScript"],
    });

    const priority = prioritizeJobOffer(offer, createScore(56));

    expect(priority.priority).toBe("watch");
    expect(priority.label).toBe("À surveiller");
  });
});