import { describe, expect, it } from "vitest";

import { buildAiAnalysisCandidatesQueryScope } from "@/lib/ai/get-ai-analysis-candidates";

describe("buildAiAnalysisCandidatesQueryScope", () => {
  it("conserve la portée globale historique avec une limite de 50 offres", () => {
    const scope = buildAiAnalysisCandidatesQueryScope({});

    expect(scope.take).toBe(50);

    expect(scope.where).toMatchObject({
      AND: [
        {
          NOT: [
            { source: { contains: "static-html" } },
            { source: { contains: "fake-dynamic-jobs" } },
            { source: { contains: "jobradar.local" } },
          ],
        },
        {
          analysis: null,
        },
      ],
    });
  });

  it("combine la date et les identifiants du batch sans doublons", () => {
    const sinceDate = new Date("2026-07-20T06:00:00.000Z");

    const scope = buildAiAnalysisCandidatesQueryScope({
      sinceDate,
      jobOfferIds: ["offer-1", "offer-2", "offer-1"],
    });

    expect(scope.take).toBe(2);

    expect(scope.where).toMatchObject({
      AND: [
        expect.any(Object),
        {
          analysis: null,
        },
        {
          createdAt: {
            gte: sinceDate,
          },
        },
        {
          id: {
            in: ["offer-1", "offer-2"],
          },
        },
      ],
    });
  });

  it("représente une liste de batch vide comme une portée vide", () => {
    const scope = buildAiAnalysisCandidatesQueryScope({
      jobOfferIds: [],
    });

    expect(scope.take).toBe(0);

    expect(scope.where).toMatchObject({
      AND: [
        expect.any(Object),
        {
          analysis: null,
        },
        {
          id: {
            in: [],
          },
        },
      ],
    });
  });

  it("ne tronque pas une campagne contenant plus de 50 offres", () => {
    const jobOfferIds = Array.from(
      { length: 74 },
      (_, index) => `offer-${index + 1}`,
    );

    const scope = buildAiAnalysisCandidatesQueryScope({
      jobOfferIds,
    });

    expect(scope.take).toBe(74);

    expect(scope.where).toMatchObject({
      AND: [
        expect.any(Object),
        {
          analysis: null,
        },
        {
          id: {
            in: jobOfferIds,
          },
        },
      ],
    });
  });
});