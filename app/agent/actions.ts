"use server";

import { runJobAgent } from "@/lib/agent/run-job-agent";

export type AgentActionState = {
  answer: string | null;
  toolCalls: {
    toolName: string;
    input: unknown;
    outputSummary: string;
  }[];
  usage: {
    inputTokens: number | undefined;
    outputTokens: number | undefined;
    totalTokens: number | undefined;
  } | null;
  error: string | null;
};

export async function askJobAgent(
  previousState: AgentActionState,
  formData: FormData,
): Promise<AgentActionState> {
  const question = formData.get("question");

  if (typeof question !== "string" || question.trim().length === 0) {
    return {
      answer: null,
      toolCalls: [],
      usage: null,
      error: "Pose une question avant d'appeler l'agent.",
    };
  }

  try {
    const result = await runJobAgent({
      prompt: question.trim(),
    });

    return {
      answer: result.answer,
      toolCalls: result.toolCalls,
      usage: result.usage,
      error: null,
    };
  } catch (error) {
    console.error("Erreur pendant l'appel agent :", error);

    return {
      answer: null,
      toolCalls: [],
      usage: null,
      error: "Une erreur est survenue pendant l'appel à l'agent.",
    };
  }
}