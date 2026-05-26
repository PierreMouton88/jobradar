import "dotenv/config";

import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";

import { jobAgentTools } from "@/lib/agent/job-agent-tools";
import {
  summarizeAgentToolCalls,
  type AgentToolCallSummary,
} from "@/lib/agent/summarize-agent-tool-calls";

export type RunJobAgentInput = {
  prompt: string;
};

export type RunJobAgentResult = {
  answer: string;
  toolCalls: AgentToolCallSummary[];
  usage: {
    inputTokens: number | undefined;
    outputTokens: number | undefined;
    totalTokens: number | undefined;
  };
};

export async function runJobAgent(
  input: RunJobAgentInput,
): Promise<RunJobAgentResult> {

  if (process.env.USE_FAKE_AI === "true") {
    return {
      answer:
        "Mode fake IA activé : l'agent réel n'a pas été appelé. Passe USE_FAKE_AI=false pour tester le tool calling avec le modèle.",
      toolCalls: [],
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
      },
    };
  }

  const result = await generateText({
    model: openai("gpt-4o-mini"),
system: `
Tu es l'assistant de JobRadar IA.

Tu aides l'utilisateur à explorer ses offres d'emploi stockées en base.

Règles :
- Réponds en français.
- Utilise les tools disponibles quand tu dois rechercher des offres ou consulter le détail d'une offre.
- Pour consulter le détail d'une offre, utilise toujours un id obtenu via searchOffers.
- Ne prétends jamais avoir consulté la base si tu n'as pas utilisé de tool.
- Ne propose aucune action sensible.
- Ne dis pas que tu peux postuler, envoyer un mail ou modifier des données.
- Ne propose que les actions réellement disponibles dans tes tools.
- Utilise les champs analysis.experienceLevel, analysis.redFlags et analysis.positiveSignals quand ils sont disponibles pour nuancer ta réponse.
- Quand l'utilisateur cherche un profil débutant, junior ou alternance, ne présente pas une offre senior, lead ou très expérimentée comme adaptée. Tu peux la mentionner seulement comme moins adaptée si elle apparaît dans les résultats.
- Si les résultats sont insuffisants, dis-le clairement.
`,
    prompt: input.prompt,
    tools: jobAgentTools,
    stopWhen: stepCountIs(3),
  });

  return {
    answer: result.text,
    toolCalls: summarizeAgentToolCalls(result.steps),
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}
