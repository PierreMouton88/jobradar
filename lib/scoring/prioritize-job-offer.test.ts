import { describe, expect, it } from "vitest";

import { JobOfferScore, ScorableJobOffer } from "./score-job-offer";
import { prioritizeJobOffer } from "./prioritize-job-offer";

const baseOffer: ScorableJobOffer = {
  title: "Développeur Fullstack React Node.js",
  skills: ["React", "TypeScript", "Node.js"],
  contractType: "CDI",
  location: "Metz",
  qualityScore: 90,
  analysis: {
    experienceLevel: "junior",
    remotePolicy: "hybrid",
    salaryMentioned: false,
    redFlags: [],
    positiveSignals: ["Stack cohérente avec le profil"],
  },
};

const baseScore: JobOfferScore = {
  score: 80,
  maxScore: 100,
  percentage: 80,
  label: "Bon match",
  positiveExplanations: [],
  negativeExplanations: [],
};

describe("prioritizeJobOffer", () => {
  it("classe une offre senior comme probablement à ignorer", () => {
    const result = prioritizeJobOffer(
      {
        ...baseOffer,
        analysis: {
          ...baseOffer.analysis!,
          experienceLevel: "senior",
        },
      },
      {
        ...baseScore,
        percentage: 85,
      },
    );

    expect(result.priority).toBe("probably_ignore");
    expect(result.label).toBe("À ignorer probablement");
    expect(result.reasons).toContainEqual({
      type: "negative",
      label: "Poste senior probablement peu adapté au profil actuel",
    });
  });

  it("classe une offre avec score correct mais sans analyse IA comme à analyser avec IA", () => {
    const result = prioritizeJobOffer(
      {
        ...baseOffer,
        analysis: null,
      },
      {
        ...baseScore,
        percentage: 55,
      },
    );

    expect(result.priority).toBe("needs_ai_analysis");
    expect(result.label).toBe("À analyser avec IA");
    expect(result.reasons).toContainEqual({
      type: "action",
      label: "Score correct mais analyse IA absente : à analyser en priorité",
    });
  });

  it("classe une offre au titre hors cible développeur comme probablement à ignorer", () => {
    const result = prioritizeJobOffer(
      {
        ...baseOffer,
        title: "Business Développeur Régional EST H/F",
        analysis: null,
      },
      {
        ...baseScore,
        percentage: 55,
      },
    );

    expect(result.priority).toBe("probably_ignore");
    expect(result.label).toBe("À ignorer probablement");
    expect(result.reasons).toContainEqual({
      type: "negative",
      label: "Titre d’offre probablement hors cible développeur",
    });
  });
  
  it("classe une offre avec score élevé et analyse IA comme très prometteuse", () => {
    const result = prioritizeJobOffer(baseOffer, {
      ...baseScore,
      percentage: 85,
    });

    expect(result.priority).toBe("very_promising");
    expect(result.label).toBe("Très prometteuse");
    expect(result.reasons).toContainEqual({
      type: "positive",
      label: "Score de compatibilité élevé",
    });
  });

  it("classe une offre avec score intéressant comme intéressante", () => {
    const result = prioritizeJobOffer(baseOffer, {
      ...baseScore,
      percentage: 70,
    });

    expect(result.priority).toBe("interesting");
    expect(result.label).toBe("Intéressante");
    expect(result.reasons).toContainEqual({
      type: "positive",
      label: "Score de compatibilité intéressant",
    });
  });

  it("classe une offre avec score moyen comme à surveiller", () => {
    const result = prioritizeJobOffer(baseOffer, {
      ...baseScore,
      percentage: 50,
    });

    expect(result.priority).toBe("watch");
    expect(result.label).toBe("À surveiller");
    expect(result.reasons).toContainEqual({
      type: "action",
      label:
        "Compatibilité moyenne : offre à surveiller sans priorité immédiate",
    });
  });

  it("classe une offre avec score faible comme peu prioritaire", () => {
    const result = prioritizeJobOffer(baseOffer, {
      ...baseScore,
      percentage: 30,
    });

    expect(result.priority).toBe("low_priority");
    expect(result.label).toBe("Peu prioritaire");
    expect(result.reasons).toContainEqual({
      type: "negative",
      label: "Score de compatibilité faible",
    });
  });

  it("dégrade une offre avec plusieurs red flags en peu prioritaire", () => {
    const result = prioritizeJobOffer(
      {
        ...baseOffer,
        analysis: {
          ...baseOffer.analysis!,
          redFlags: [
            "Autonomie immédiate attendue",
            "Délais très courts",
            "Stack partiellement éloignée",
          ],
        },
      },
      {
        ...baseScore,
        percentage: 82,
      },
    );

    expect(result.priority).toBe("low_priority");
    expect(result.label).toBe("Peu prioritaire");
    expect(result.reasons).toContainEqual({
      type: "negative",
      label: "Plusieurs points de vigilance détectés par l’analyse IA",
    });
  });
});
