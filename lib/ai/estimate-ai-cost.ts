type EstimateAiCostInput = {
  modelName: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

type ModelPricing = {
  inputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4.1-mini": {
    inputPricePerMillionTokens: 0.4,
    outputPricePerMillionTokens: 1.6,
  },
};

export function estimateAiCostInDollarCents({
  modelName,
  inputTokens,
  outputTokens,
}: EstimateAiCostInput): number | null {
  if (!modelName || inputTokens === null || outputTokens === null) {
    return null;
  }

  const pricing = MODEL_PRICING[modelName];

  if (!pricing) {
    return null;
  }

  const inputCost =
    (inputTokens / 1_000_000) * pricing.inputPricePerMillionTokens;

  const outputCost =
    (outputTokens / 1_000_000) * pricing.outputPricePerMillionTokens;

  return (inputCost + outputCost) * 100;
}