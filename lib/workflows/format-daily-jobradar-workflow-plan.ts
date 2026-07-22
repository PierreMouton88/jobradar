import type {
  DailyJobRadarWorkflowPlan,
  DailyJobRadarWorkflowStepPlan,
  DailyJobRadarWorkflowStepReason,
} from "@/lib/workflows/build-daily-jobradar-workflow-plan";

function getStepStatusLabel(
  step: DailyJobRadarWorkflowStepPlan,
): string {
  return step.status === "PLANNED" ? "PLANIFIÉE" : "IGNORÉE";
}

function getStepReasonLabel(
  reason: DailyJobRadarWorkflowStepReason,
): string {
  switch (reason) {
    case "READY":
      return "étape autorisée";

    case "WORKFLOW_DISABLED":
      return "workflow global désactivé";

    case "STEP_DISABLED":
      return "étape désactivée";

    case "LIMIT_ZERO":
      return "limite configurée à zéro";

    default: {
      const exhaustiveCheck: never = reason;
      return exhaustiveCheck;
    }
  }
}

function formatStep(step: DailyJobRadarWorkflowStepPlan): string[] {
  return [
    `- [${getStepStatusLabel(step)}] ${step.label}`,
    `  Raison : ${getStepReasonLabel(step.reason)}`,
    `  Appel externe possible : ${step.external ? "oui" : "non"}`,
  ];
}

export function formatDailyJobRadarWorkflowPlan(
  plan: DailyJobRadarWorkflowPlan,
): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("JobRadar IA — Preview workflow quotidien");
  lines.push("========================================");
  lines.push("");
  lines.push(
    `Workflow global : ${plan.enabled ? "activé" : "désactivé"}`,
  );
  lines.push(`Fuseau horaire : ${plan.timezone}`);
  lines.push("");

  lines.push("Étapes");
  lines.push("------");

  for (const step of plan.steps) {
    lines.push(...formatStep(step));
    lines.push("");
  }

  lines.push("Limites effectives");
  lines.push("------------------");
  lines.push(`Localisations Apify : ${plan.limits.maxLocations}`);
  lines.push(
    `Offres maximales par plan Apify : ${plan.limits.maxOffersPerPlan}`,
  );
  lines.push(
    `Documents RAG maximaux : ${plan.limits.maxRagDocuments}`,
  );
  lines.push(
    `Embeddings maximaux : ${plan.limits.maxEmbeddings}`,
  );
  lines.push(
    `Analyses IA maximales : ${plan.limits.maxAiAnalyses}`,
  );
  lines.push(`Emails maximaux : ${plan.limits.maxEmails}`);
  lines.push("");

  lines.push("Résumé");
  lines.push("------");
  lines.push(
    `Étapes planifiées : ${plan.summary.plannedSteps}`,
  );
  lines.push(`Étapes ignorées : ${plan.summary.skippedSteps}`);
  lines.push(
    `Appels externes autorisés : ${
      plan.summary.externalCallsAuthorized ? "oui" : "non"
    }`,
  );
  lines.push("");

  lines.push(
    "Preview terminée. Aucun Actor Apify, appel OpenAI, embedding, email ou écriture métier n’a été exécuté.",
  );
  lines.push("");

  return lines.join("\n");
}