import { describe, expect, it } from "vitest";

import { estimateAiCostInDollarCents } from "./estimate-ai-cost";

describe("estimate-ai-cost", () => {
  it("retourne null si le modèle est absent", () => {
    expect(
      estimateAiCostInDollarCents({
        modelName: null,
        inputTokens: 1000,
        outputTokens: 500,
      }),
    ).toBeNull();
  });

  it("retourne null si les tokens sont absents", () => {
    expect(
      estimateAiCostInDollarCents({
        modelName: "gpt-4.1-mini",
        inputTokens: null,
        outputTokens: 500,
      }),
    ).toBeNull();

    expect(
      estimateAiCostInDollarCents({
        modelName: "gpt-4.1-mini",
        inputTokens: 1000,
        outputTokens: null,
      }),
    ).toBeNull();
  });

  it("retourne null si le modèle n'est pas connu", () => {
    expect(
      estimateAiCostInDollarCents({
        modelName: "unknown-model",
        inputTokens: 1000,
        outputTokens: 500,
      }),
    ).toBeNull();
  });

  it("estime le coût en centimes de dollar", () => {
    expect(
      estimateAiCostInDollarCents({
        modelName: "gpt-4.1-mini",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }),
    ).toBe(200);
  });

  it("accepte un résultat décimal pour les petits volumes de tokens", () => {
    expect(
      estimateAiCostInDollarCents({
        modelName: "gpt-4.1-mini",
        inputTokens: 1_000,
        outputTokens: 500,
      }),
    ).toBeCloseTo(0.12);
  });
});