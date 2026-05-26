export type AgentToolCallSummary = {
  toolName: string;
  input: unknown;
  outputSummary: string;
};

type AgentStepLike = {
  content: AgentStepContentLike[];
};

type AgentStepContentLike = {
  type: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

export function summarizeAgentToolCalls(
  steps: AgentStepLike[],
): AgentToolCallSummary[] {
  const summaries: AgentToolCallSummary[] = [];

  for (const step of steps) {
    for (const contentItem of step.content) {
      if (contentItem.type !== "tool-result") {
        continue;
      }

      summaries.push({
        toolName: contentItem.toolName ?? "unknownTool",
        input: contentItem.input,
        outputSummary: summarizeToolOutput(contentItem.output),
      });
    }
  }

  return summaries;
}

export function summarizeToolOutput(output: unknown): string {
  if (!isRecord(output)) {
    return "résultat non structuré";
  }

  if (typeof output.count === "number" && Array.isArray(output.offers)) {
    return `${output.count} résultat(s)`;
  }

  if (output.found === false) {
    return "offre introuvable";
  }

  if (output.found === true && isRecord(output.offer)) {
    const title = typeof output.offer.title === "string"
      ? output.offer.title
      : "titre inconnu";

    const company = typeof output.offer.company === "string"
      ? output.offer.company
      : "entreprise inconnue";

    return `offre trouvée : ${title} chez ${company}`;
  }

  return "résultat reçu";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}