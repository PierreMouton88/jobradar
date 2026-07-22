import type { DailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

export type DailyJobRadarWorkflowStepId =
  | "APIFY_IMPORT"
  | "RAG_SYNC"
  | "AI_ANALYSIS"
  | "REPORT"
  | "EMAIL";

export type DailyJobRadarWorkflowStepStatus = "PLANNED" | "SKIPPED";

export type DailyJobRadarWorkflowStepReason =
  | "READY"
  | "WORKFLOW_DISABLED"
  | "STEP_DISABLED"
  | "LIMIT_ZERO";

export type DailyJobRadarWorkflowStepPlan = {
  id: DailyJobRadarWorkflowStepId;
  label: string;
  status: DailyJobRadarWorkflowStepStatus;
  reason: DailyJobRadarWorkflowStepReason;
  external: boolean;
};

export type DailyJobRadarWorkflowPlan = {
  enabled: boolean;
  timezone: string;
  steps: DailyJobRadarWorkflowStepPlan[];

  limits: {
    maxLocations: number;
    maxOffersPerPlan: number;
    maxRagDocuments: number;
    maxEmbeddings: number;
    maxAiAnalyses: number;
    maxEmails: number;
  };

  summary: {
    plannedSteps: number;
    skippedSteps: number;
    externalCallsAuthorized: boolean;
  };
};

function createConfigurableStep(input: {
  id: DailyJobRadarWorkflowStepId;
  label: string;
  workflowEnabled: boolean;
  stepEnabled: boolean;
  external: boolean;
  blockedByZeroLimit?: boolean;
}): DailyJobRadarWorkflowStepPlan {
  if (!input.workflowEnabled) {
    return {
      id: input.id,
      label: input.label,
      status: "SKIPPED",
      reason: "WORKFLOW_DISABLED",
      external: input.external,
    };
  }

  if (!input.stepEnabled) {
    return {
      id: input.id,
      label: input.label,
      status: "SKIPPED",
      reason: "STEP_DISABLED",
      external: input.external,
    };
  }

  if (input.blockedByZeroLimit) {
    return {
      id: input.id,
      label: input.label,
      status: "SKIPPED",
      reason: "LIMIT_ZERO",
      external: input.external,
    };
  }

  return {
    id: input.id,
    label: input.label,
    status: "PLANNED",
    reason: "READY",
    external: input.external,
  };
}

function createReportStep(
  workflowEnabled: boolean,
): DailyJobRadarWorkflowStepPlan {
  if (!workflowEnabled) {
    return {
      id: "REPORT",
      label: "Génération du rapport",
      status: "SKIPPED",
      reason: "WORKFLOW_DISABLED",
      external: false,
    };
  }

  return {
    id: "REPORT",
    label: "Génération du rapport",
    status: "PLANNED",
    reason: "READY",
    external: false,
  };
}

function isStepPlanned(
  steps: DailyJobRadarWorkflowStepPlan[],
  stepId: DailyJobRadarWorkflowStepId,
): boolean {
  return steps.some(
    (step) => step.id === stepId && step.status === "PLANNED",
  );
}

export function buildDailyJobRadarWorkflowPlan(
  config: DailyJobRadarWorkflowConfig,
): DailyJobRadarWorkflowPlan {
  const steps: DailyJobRadarWorkflowStepPlan[] = [
    createConfigurableStep({
      id: "APIFY_IMPORT",
      label: "Campagne d’import Apify",
      workflowEnabled: config.enabled,
      stepEnabled: config.apify.enabled,
      external: true,
    }),

    createConfigurableStep({
      id: "RAG_SYNC",
      label: "Synchronisation RAG de la campagne",
      workflowEnabled: config.enabled,
      stepEnabled: config.rag.enabled,
      blockedByZeroLimit: config.rag.maxDocuments === 0,
      external: true,
    }),

    createConfigurableStep({
      id: "AI_ANALYSIS",
      label: "Analyses IA contrôlées",
      workflowEnabled: config.enabled,
      stepEnabled: config.ai.enabled,
      blockedByZeroLimit: config.ai.maxAnalyses === 0,
      external: true,
    }),

    createReportStep(config.enabled),

    createConfigurableStep({
      id: "EMAIL",
      label: "Envoi du digest email",
      workflowEnabled: config.enabled,
      stepEnabled: config.email.enabled,
      external: true,
    }),
  ];

  const apifyPlanned = isStepPlanned(steps, "APIFY_IMPORT");
  const ragPlanned = isStepPlanned(steps, "RAG_SYNC");
  const aiPlanned = isStepPlanned(steps, "AI_ANALYSIS");
  const emailPlanned = isStepPlanned(steps, "EMAIL");

  const plannedSteps = steps.filter(
    (step) => step.status === "PLANNED",
  ).length;

  const skippedSteps = steps.length - plannedSteps;

  return {
    enabled: config.enabled,
    timezone: config.timezone,
    steps,

    limits: {
      maxLocations: apifyPlanned ? config.apify.maxLocations : 0,
      maxOffersPerPlan: apifyPlanned
        ? config.apify.maxOffersPerPlan
        : 0,

      maxRagDocuments: ragPlanned ? config.rag.maxDocuments : 0,
      maxEmbeddings: ragPlanned ? config.rag.maxEmbeddings : 0,

      maxAiAnalyses: aiPlanned ? config.ai.maxAnalyses : 0,
      maxEmails: emailPlanned ? 1 : 0,
    },

    summary: {
      plannedSteps,
      skippedSteps,
      externalCallsAuthorized: steps.some(
        (step) => step.external && step.status === "PLANNED",
      ),
    },
  };
}