import { describe, expect, it } from "vitest";
import { AiAnalysisCandidate, selectAiAnalysisCandidates } from "./select-ai-analysis-candidates";
import { JobOfferScore } from "../scoring/score-job-offer";
import { OfferPriorityLevel } from "../scoring/prioritize-job-offer";



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

function createCandidate({
  id,
  percentage,
  priority,
  hasAnalysis = false,
}: {
  id: string;
  percentage: number;
  priority: OfferPriorityLevel;
  hasAnalysis?: boolean;
}): AiAnalysisCandidate {
  return {
    offer: {
      id,
      title: `Offre ${id}`,
      company: "Test company",
      url: `https://example.com/jobs/${id}`,
      skills: ["React", "TypeScript"],
      contractType: "CDI",
      location: "Metz",
      qualityScore: 90,
      analysis: hasAnalysis
        ? {
            experienceLevel: "junior",
            remotePolicy: "hybrid",
            salaryMentioned: true,
            redFlags: [],
            positiveSignals: ["Stack alignée avec le profil"],
          }
        : null,
    },
    score: createScore(percentage),
    priority: {
      priority,
      label: priority,
      reasons: [],
    },
  };
}

describe("selectAiAnalysisCandidates", () => {
  it("returns an empty list when limit is zero", () => {
    const candidates = [
      createCandidate({
        id: "offer-1",
        percentage: 80,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 0,
    });

    expect(selected).toEqual([]);
  });

  it("ignores offers that already have an AI analysis", () => {
    const candidates = [
      createCandidate({
        id: "already-analyzed",
        percentage: 90,
        priority: "very_promising",
        hasAnalysis: true,
      }),
      createCandidate({
        id: "not-analyzed",
        percentage: 75,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 5,
    });

    expect(selected.map((candidate) => candidate.offer.id)).toEqual([
      "not-analyzed",
    ]);
  });

  it("ignores low priority and probably ignored offers", () => {
    const candidates = [
      createCandidate({
        id: "low-priority",
        percentage: 40,
        priority: "low_priority",
      }),
      createCandidate({
        id: "probably-ignore",
        percentage: 90,
        priority: "probably_ignore",
      }),
      createCandidate({
        id: "valid-candidate",
        percentage: 70,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 5,
    });

    expect(selected.map((candidate) => candidate.offer.id)).toEqual([
      "valid-candidate",
    ]);
  });

  it("prioritizes offers that need AI analysis before interesting offers", () => {
    const candidates = [
      createCandidate({
        id: "interesting",
        percentage: 95,
        priority: "interesting",
      }),
      createCandidate({
        id: "needs-ai-analysis",
        percentage: 60,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 5,
    });

    expect(selected.map((candidate) => candidate.offer.id)).toEqual([
      "needs-ai-analysis",
      "interesting",
    ]);
  });

  it("sorts by score when candidates have the same priority", () => {
    const candidates = [
      createCandidate({
        id: "lower-score",
        percentage: 65,
        priority: "needs_ai_analysis",
      }),
      createCandidate({
        id: "higher-score",
        percentage: 85,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 5,
    });

    expect(selected.map((candidate) => candidate.offer.id)).toEqual([
      "higher-score",
      "lower-score",
    ]);
  });

  it("limits the number of selected candidates", () => {
    const candidates = [
      createCandidate({
        id: "offer-1",
        percentage: 90,
        priority: "needs_ai_analysis",
      }),
      createCandidate({
        id: "offer-2",
        percentage: 80,
        priority: "needs_ai_analysis",
      }),
      createCandidate({
        id: "offer-3",
        percentage: 70,
        priority: "needs_ai_analysis",
      }),
    ];

    const selected = selectAiAnalysisCandidates({
      candidates,
      limit: 2,
    });

    expect(selected.map((candidate) => candidate.offer.id)).toEqual([
      "offer-1",
      "offer-2",
    ]);
  });
});